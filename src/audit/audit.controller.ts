import { Response } from "express";
import { AsyncWrapper } from "../utils/AsyncWrapper";
import { AuthenticatedRequest } from "../auth/auth.service";
import { BaseQueryRequest } from "../utils/base-query.request";
import auditService from "./audit.service";
import { EntityType, AuditAction } from "./audit.model";

class AuditController {
  /**
   * GET /audit/entity/:entityType/:entityId
   * Get audit history for a specific entity
   */
  getEntityHistory = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const { entityType, entityId } = req.params;

      const logs = await auditService.getEntityHistory(
        entityType as EntityType,
        entityId,
      );

      res.status(200).json({
        status: "success",
        results: logs.length,
        data: { logs },
      });
    },
  );

  /**
   * GET /audit/user/:userId
   * Get all actions performed by a specific user
   */
  getUserActivity = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const { userId } = req.params;

      const logs = await auditService.getUserActivity(userId);

      res.status(200).json({
        status: "success",
        results: logs.length,
        data: { logs },
      });
    },
  );

  /**
   * GET /audit
   * Get audit logs with filtering and pagination
   * Query params: entityType, action, userId, from, to, page, limit
   */
  getAuditLogs = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const queryParams = {
        ...new BaseQueryRequest(req.query),
        entityType: req.query.entityType as EntityType | undefined,
        action: req.query.action as AuditAction | undefined,
        userId: req.query.userId as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      };

      const { logs, total } = await auditService.getAuditLogs(queryParams);

      res.status(200).json({
        status: "success",
        results: logs.length,
        total,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
        },
        data: { logs },
      });
    },
  );

  getCompanyAuditLogs = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const { companyId } = req.params;
      const queryParams = {
        ...new BaseQueryRequest(req.query),
        entityType: req.query.entityType as EntityType | undefined,
        action: req.query.action as AuditAction | undefined,
      };
      const { logs, total, pagination } =
        await auditService.getCompanyAuditLogs(companyId, queryParams);

      res.status(200).json({
        status: "success",
        results: logs.length,
        total,
        pagination,
        data: logs,
      });
    },
  );
}

export default new AuditController();
