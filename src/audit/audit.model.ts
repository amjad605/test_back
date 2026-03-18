import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export type EntityType = "Company" | "Employee" | "Document" | "Task" | "User";

export interface IAuditLog extends MongooseDocument {
  associatedCompany?: Types.ObjectId;
  user: Types.ObjectId;
  entityType: EntityType;
  entityId: Types.ObjectId;
  entityName: string;
  action: AuditAction;
  changes: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    associatedCompany: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["Company", "Employee", "Document", "Task", "User"],
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    entityName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE"],
      required: true,
    },
    changes: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Compound index for entity history lookups
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

// Index for user activity queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", AuditLogSchema);
