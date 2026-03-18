import { AsyncWrapper } from "../utils/AsyncWrapper";
import { Request, Response, NextFunction } from "express";
import userService from "./users.service";
import { BaseQueryRequest } from "../utils/base-query.request";
import { validateInput } from "../utils/validationErrors";
import {
  createInternalUserSchema,
  createUserSchema,
  updateInternalUserSchema,
  updateUserSchema,
} from "./users.validation";
import { AuthenticatedRequest } from "../auth/auth.service";

class UserController {
  getUsers = AsyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const reqQuery = new BaseQueryRequest(req.query);
      const { users, total } = await userService.getUsers(reqQuery);
      return res.status(200).json({
        status: "success",
        results: users.length,
        pagination: { page: reqQuery.page, limit: reqQuery.limit, total },
        data: users,
      });
    },
  );

  createUser = AsyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = validateInput(createUserSchema, req.body);
      const user = await userService.createUser(validatedBody);
      return res.status(201).json({ status: "success", data: user });
    },
  );

  createInternalUser = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const validatedBody = validateInput(createInternalUserSchema, req.body);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const avatarFile = files?.avatar ? files.avatar[0] : undefined;
      const attachmentFiles = files?.attachments || [];
      const user = await userService.createInternalUser(
        validatedBody,
        req.user!.id,
        {
          avatar: avatarFile,
          attachments: attachmentFiles,
        },
      );
      return res.status(201).json({ status: "success", data: user });
    },
  );
  getInternalUsers = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const reqQuery = new BaseQueryRequest(req.query);
      const { users, total } = await userService.getInternalUsers(reqQuery);
      return res.status(200).json({
        status: "success",
        results: users.length,
        pagination: { page: reqQuery.page, limit: reqQuery.limit, total },
        data: users,
      });
    },
  );
  getUser = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = await userService.getUser(req.params.id);
      return res.status(200).json({ status: "success", data: user });
    },
  );
  updateUser = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const validatedBody = validateInput(createUserSchema, req.body);
      const user = await userService.updateUser(req.params.id, validatedBody);
      return res.status(200).json({ status: "success", data: user });
    },
  );
  deleteUser = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = await userService.deleteUser(req.params.id);
      return res.status(200).json({ status: "success", data: user });
    },
  );
  getInternalUser = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = await userService.getInternalUser(req.params.id);
      return res.status(200).json({ status: "success", data: user });
    },
  );
  updateInternalUser = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const validatedBody = validateInput(updateInternalUserSchema, req.body);
      const userId = req.user!.id || req.user!._id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const avatarFile = files?.avatar ? files.avatar[0] : undefined;
      const attachmentFiles = files?.attachments || [];
      const user = await userService.updateInternalEmployee(
        req.params.id,
        validatedBody,
        userId,
        {
          avatar: avatarFile,
          attachments: attachmentFiles,
        },
      );
      return res.status(200).json({ status: "success", data: user });
    },
  );
  deleteInternalUser = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const userId = req.user!.id || req.user!._id;
      const user = await userService.deleteInternalEmployee(
        req.params.id,
        userId,
      );
      return res.status(200).json({ status: "success", data: user });
    },
  );
}

export default new UserController();
