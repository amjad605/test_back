import { Router } from "express";
import authController from "../auth/auth.controller";
import TasksController from "./tasks.controller";
import tasksController from "./tasks.controller";
import { upload } from "../utils/multer";
const tasksRouter = Router();
tasksRouter.use(authController.authenticateToken);
tasksRouter.get(
  "/",
  authController.authorizeStaff,
  TasksController.getAllTasks,
);
tasksRouter.post(
  "/",
  authController.authorizeStaff,
  upload.array("attachments"),

  TasksController.createTask,
);
tasksRouter.get(
  "/:id",
  authController.authorizeStaff,
  TasksController.getTaskById,
);
tasksRouter.patch(
  "/:id",
  authController.authorizeStaff,
  upload.single("attachment"),
  TasksController.updateTask,
);
tasksRouter.delete(
  "/:id",
  authController.authorizeOwner,
  TasksController.deleteTask,
);
tasksRouter.post(
  "/:id/attachments",
  authController.authorizeManagement,

  upload.single("file"),
  tasksController.addAttachment,
);
tasksRouter.get(
  "/my-tasks",
  authController.authenticateToken,
  tasksController.getMyTasks,
);

tasksRouter.post(
  "/:id/notes",
  authController.authenticateToken,
  authController.authorizeStaff,
  tasksController.addNote,
);
export default tasksRouter;
