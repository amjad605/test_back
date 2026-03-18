import { Router } from "express";
import authController from "../auth/auth.controller";
import auditController from "./audit.controller";

const auditRouter = Router();

// All audit routes require authentication
auditRouter.use(authController.authenticateToken);

// All audit read routes require Owner role
auditRouter.get(
  "/entity/:entityType/:entityId",
  authController.authorizeStaff,
  auditController.getEntityHistory,
);

auditRouter.get(
  "/user/:userId",
  authController.authorizeOwner,
  auditController.getUserActivity,
);

auditRouter.get(
  "/",
  authController.authorizeOwner,
  auditController.getAuditLogs,
);
auditRouter.get(
  "/company/:companyId",
  authController.authorizeOwner,
  auditController.getCompanyAuditLogs,
);

export default auditRouter;
