import { Router } from "express";
import authController from "../auth/auth.controller";
import dashboardController from "./dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.use(authController.authenticateToken);

dashboardRouter.get("/", dashboardController.getDashboard);

export default dashboardRouter;
