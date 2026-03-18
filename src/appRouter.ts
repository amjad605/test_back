import { Router } from "express";
import authRouter from "./auth/auth.router";
import companyRouter from "./companies/company.router";
import employeeRouter from "./employee/employee.router";
import documentRouter from "./documents/document.router";
import tasksRouter from "./tasks/tasks.router";
import auditRouter from "./audit/audit.router";
import userRouter from "./users/users.router";
import dashboardRouter from "./dashboard/dashboard.router";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/companies", companyRouter);
appRouter.use("/employees", employeeRouter);
appRouter.use("/documents", documentRouter);
appRouter.use("/tasks", tasksRouter);
appRouter.use("/audit", auditRouter);
appRouter.use("/users", userRouter);
appRouter.use("/dashboard", dashboardRouter);

export default appRouter;
