import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../auth/auth.service";
import { AsyncWrapper } from "../utils/AsyncWrapper";
import { BaseQueryRequest } from "../utils/base-query.request";
import TasksService from "./tasks.service";
import { AppError } from "../utils/AppError";
import { CreateTaskSchema } from "./tasks.validation";
import { validateInput } from "../utils/validationErrors";

class TasksController {
  createTask = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const validatedBody = validateInput(CreateTaskSchema, req.body);

      const file = req.files as Express.Multer.File[];

      const task = await TasksService.createTask(validatedBody, file, req.user);

      res.status(201).json({
        status: "success",
        data: task,
      });
    },
  );

  getAllTasks = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const query = new BaseQueryRequest(req.query);

      const { tasks, total, stats } = await TasksService.getAllTasks(
        query,
        req.user,
      );

      res.status(200).json({
        status: "success",
        results: tasks.length,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
        },

        data: tasks,
        stats,
      });
    },
  );

  getTaskById = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const task = await TasksService.getTaskById(req.params.id, req.user);

      res.status(200).json({
        status: "success",
        data: task,
      });
    },
  );

  updateTask = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const task = await TasksService.updateTask(
        req.params.id,
        req.body,
        req.user,
      );

      res.status(200).json({
        status: "success",
        data: task,
      });
    },
  );

  deleteTask = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      await TasksService.deleteTask(req.params.id, req.user);
      res.status(204).send();
    },
  );
  addAttachment = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.file) {
        throw new AppError("No file uploaded", 400);
      }

      const task = await TasksService.addAttachment(
        req.params.id,
        req.file,
        req.user,
      );

      res.status(200).json({
        status: "success",
        data: task,
      });
    },
  );
  getMyTasks = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const query = new BaseQueryRequest(req.query);
      const { tasks, total } = await TasksService.getMyTasks(req.user, query);
      res.status(200).json({
        status: "success",
        results: tasks.length,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
        },
        data: tasks,
      });
    },
  );

  addNote = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { text, isInternalOnly } = req.body;

    const task = await TasksService.addNote(id, text, isInternalOnly, req.user);
    res.status(200).json(task);
  });
}

export default new TasksController();
