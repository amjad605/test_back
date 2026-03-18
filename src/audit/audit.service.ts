import { AuditLog, AuditAction, EntityType, IAuditLog } from "./audit.model";
import { BaseQueryRequest } from "../utils/base-query.request";
import ApiFeatures from "../utils/ApiFeatures";
import { Types } from "mongoose";

class AuditService {
  /**
   * Log a CREATE action
   */
  async logCreate(
    user: string,
    entityType: EntityType,
    entity: any,
    associatedCompany?: Types.ObjectId,
  ): Promise<void> {
    const changes = this.generateChangesString("CREATE", entityType, entity);
    const entityName = this.getEntityIdentifier(entityType, entity);

    await AuditLog.create({
      associatedCompany,
      user,
      entityType,
      entityId: entity._id,
      entityName,
      action: "CREATE",
      changes,
    });
  }

  /**
   * Log an UPDATE action with diff calculation
   */
  async logUpdate(
    user: string,
    entityType: EntityType,
    entityId: string,
    oldData: any,
    newData: any,
    associatedCompany?: Types.ObjectId,
  ): Promise<void> {
    const changes = this.generateUpdateChangesString(
      entityType,
      oldData,
      newData,
    );

    // Only log if there are actual changes
    if (changes) {
      const entityName = this.getEntityIdentifier(
        entityType,
        newData || oldData,
      );
      await AuditLog.create({
        user,
        entityType,
        entityId,
        entityName,
        action: "UPDATE",
        changes,
        associatedCompany,
      });
    }
  }

  /**
   * Log a DELETE action
   */
  async logDelete(
    user: string,
    entityType: EntityType,
    entity: any,
    associatedCompany?: Types.ObjectId,
  ): Promise<void> {
    const changes = this.generateChangesString("DELETE", entityType, entity);
    const entityName = this.getEntityIdentifier(entityType, entity);

    await AuditLog.create({
      user,
      entityType,
      entityId: entity._id,
      entityName,
      action: "DELETE",
      changes,
      associatedCompany,
    });
  }

  /**
   * Generate human-readable changes string for CREATE/DELETE
   */
  private generateChangesString(
    action: AuditAction,
    entityType: EntityType,
    entity: any,
  ): string {
    const identifier = this.getEntityIdentifier(entityType, entity);

    if (action === "CREATE") {
      return `Created ${entityType}: ${identifier}`;
    }

    if (action === "DELETE") {
      return `Deleted ${entityType}: ${identifier}`;
    }

    return `${action} on ${entityType}: ${identifier}`;
  }

  /**
   * Generate human-readable changes string for UPDATE
   * Shows which fields changed and their old -> new values
   */
  private generateUpdateChangesString(
    entityType: EntityType,
    oldData: any,
    newData: any,
  ): string | null {
    const changedFields: string[] = [];

    // Fields to ignore in diff
    const ignoredFields = [
      "_id",
      "__v",
      "createdAt",
      "updatedAt",
      "password",
      "attachments",
    ];

    // Compare fields
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);

    for (const key of allKeys) {
      if (ignoredFields.includes(key)) continue;

      const oldValue = oldData?.[key];
      const newValue = newData?.[key];

      // Handle nested objects by converting to string for comparison
      const oldStr = this.valueToString(oldValue);
      const newStr = this.valueToString(newValue);

      if (oldStr !== newStr) {
        changedFields.push(`${key}: "${oldStr}" → "${newStr}"`);
      }
    }

    if (changedFields.length === 0) return null;

    const identifier = this.getEntityIdentifier(entityType, newData || oldData);
    return `Updated ${entityType} (${identifier}): ${changedFields.join(", ")}`;
  }

  /**
   * Get a human-readable identifier for an entity
   */
  private getEntityIdentifier(entityType: EntityType, entity: any): string {
    switch (entityType) {
      case "Company":
        return entity?.name || entity?._id?.toString() || "Unknown";
      case "Employee":
        return entity?.fullName || entity?._id?.toString() || "Unknown";
      case "Document":
        return entity?.title || entity?._id?.toString() || "Unknown";
      case "Task":
        return entity?.title || entity?._id?.toString() || "Unknown";
      case "User":
        return (
          entity?.name || entity?.email || entity?._id?.toString() || "Unknown"
        );
      default:
        return entity?._id?.toString() || "Unknown";
    }
  }

  /**
   * Convert a value to string for comparison
   */
  private valueToString(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      if (value instanceof Date) return value.toISOString();
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Get audit history for a specific entity
   */
  async getEntityHistory(
    entityType: EntityType,
    entityId: string,
  ): Promise<IAuditLog[]> {
    return AuditLog.find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .exec();
  }

  /**
   * Get all actions performed by a specific user
   */
  async getUserActivity(user: string): Promise<IAuditLog[]> {
    return AuditLog.find({ user }).sort({ createdAt: -1 }).limit(100).exec();
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    reqQuery: BaseQueryRequest & {
      entityType?: EntityType;
      action?: AuditAction;
      user?: string;
      from?: string;
      to?: string;
    },
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    const filter: any = {};

    if (reqQuery.entityType) filter.entityType = reqQuery.entityType;
    if (reqQuery.action) filter.action = reqQuery.action;
    if (reqQuery.user) filter.user = reqQuery.user;

    if (reqQuery.from || reqQuery.to) {
      filter.createdAt = {};
      if (reqQuery.from) filter.createdAt.$gte = new Date(reqQuery.from);
      if (reqQuery.to) filter.createdAt.$lte = new Date(reqQuery.to);
    }

    const total = await AuditLog.countDocuments(filter);

    let mongooseQuery = AuditLog.find(filter)
      .sort("-createdAt")
      .populate("user", "name email");

    mongooseQuery = ApiFeatures.paginate(
      mongooseQuery,
      reqQuery.page,
      reqQuery.limit,
    );

    const logs = await mongooseQuery;
    return { logs, total };
  }

  async getCompanyAuditLogs(
    companyId: string,
    query: BaseQueryRequest & {
      entityType?: EntityType;
      action?: AuditAction;
    },
  ): Promise<{ logs: IAuditLog[]; total: number; pagination: any }> {
    const filter: any = {};

    if (query.entityType) filter.entityType = query.entityType;
    if (query.action) filter.action = query.action;

    const total = await AuditLog.countDocuments({
      associatedCompany: companyId,
      ...filter,
    });

    let mongooseQuery = AuditLog.find({
      associatedCompany: companyId,
      ...filter,
    })
      .sort("-createdAt")
      .populate("user", "name email");

    mongooseQuery = ApiFeatures.paginate(
      mongooseQuery,
      query.page,
      query.limit,
    );

    const logs = await mongooseQuery;

    return {
      logs,
      total,
      pagination: {
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    };
  }
}

export default new AuditService();
