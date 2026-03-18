import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { AsyncWrapper } from "../utils/AsyncWrapper";
import { validateInput } from "../utils/validationErrors";
import { assignRoleSchema, updateUserSchema } from "./auth.schema";
import authService, { AuthenticatedRequest } from "./auth.service";

class AuthController {
  private authService;

  constructor() {
    this.authService = authService;
  }

  authenticateToken = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      let token = req.cookies?.accessToken;

      if (!token && req.headers["authorization"]) {
        token = (req.headers["authorization"] as string).split(" ")[1];
      }

      const decoded = this.authService.authenticateToken(token);
      req.user = decoded;
      next();
    },
  );

  authorizeOwner = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (req.user && req.user.role === "Owner") next();
      else throw new AppError("Forbidden: Owner access required", 403);
    },
  );

  authorizeStaff = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (req.user && (req.user.role === "Staff" || req.user.role === "Owner"))
        next();
      else throw new AppError("Forbidden: Staff access required", 403);
    },
  );

  authorizeClient = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (req.user && req.user.role === "Client") next();
      else throw new AppError("Forbidden: Client access required", 403);
    },
  );

  authorizeHR = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (req.user && (req.user.role === "HR" || req.user.role === "Owner"))
        next();
      else throw new AppError("Forbidden: HR access required", 403);
    },
  );

  authorizeManagement = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const allowedRoles = ["Owner", "Staff", "HR"];
      if (req.user && allowedRoles.includes(req.user.role)) next();
      else throw new AppError("Forbidden: Management access required", 403);
    },
  );

  login = AsyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, password } = req.body;
      const { accessToken, refreshToken, user } = await this.authService.login(
        email,
        password,
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        status: "success",
        data: {
          accessToken,
          refreshToken,
          user,
        },
      });
    },
  );

  verifyRefreshToken = AsyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      let token = req.cookies?.refreshToken;

      if (!token && req.headers["authorization"]) {
        token = (req.headers["authorization"] as string).split(" ")[1];
      }

      const newAccessToken = this.authService.verifyRefreshToken(token);

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      });

      return res.status(200).json({
        status: "success",
        data: {
          accessToken: newAccessToken,
        },
      });
    },
  );

  updateUser = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const id = req.params.id;
      const validatedData = validateInput(updateUserSchema, req.body);
      const user = await this.authService.updateUser(
        id,
        validatedData,
        req.user?.id,
      );

      return res.status(200).json({
        status: "success",
        data: {
          user,
        },
      });
    },
  );

  assignRole = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const id = req.params.id;

      const validatedData = validateInput(assignRoleSchema, req.body);
      const user = await this.authService.updateUser(
        id,
        {
          role: validatedData.role,
        },
        req.user?.id,
      );

      return res.status(200).json({
        status: "success",
        data: {
          user,
        },
      });
    },
  );

  getUsers = AsyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await this.authService.getUsers(req.query);

      return res.status(200).json({
        status: "success",
        ...result,
      });
    },
  );
}

export default new AuthController();
