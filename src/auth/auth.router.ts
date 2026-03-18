import { Router } from "express";
import authController from "./auth.controller";

const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.post(
  "/refresh-token",
  authController.authenticateToken,
  authController.verifyRefreshToken,
);

authRouter.get(
  "/users",
  authController.authenticateToken,
  authController.authorizeOwner,
  authController.getUsers,
);

authRouter.patch(
  "/users/:id",
  authController.authenticateToken,
  authController.authorizeManagement,
  authController.updateUser,
);

authRouter.patch(
  "/users/:id/role",
  authController.authenticateToken,
  authController.authorizeOwner,
  authController.assignRole,
);

export default authRouter;
