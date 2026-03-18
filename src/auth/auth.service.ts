import { Request } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppError } from "../utils/AppError";
import auditService from "../audit/audit.service";
import { User } from "../users/user.model";

export interface CustomJwtPayload extends JwtPayload {
  id: string;
  role: string;
  companyId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: CustomJwtPayload;
}

class AuthService {
  private accessTokenSecret: Secret;
  private refreshTokenSecret: Secret;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || "access_secret";
    this.refreshTokenSecret =
      process.env.REFRESH_TOKEN_SECRET || "refresh_secret";
  }

  authenticateToken(token: string) {
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    try {
      const decoded = jwt.verify(
        token,
        this.accessTokenSecret,
      ) as CustomJwtPayload;
      return decoded;
    } catch (err) {
      throw new AppError("Unauthorized", 401);
    }
  }

  generateAccessToken(payload: object) {
    return jwt.sign(payload, this.accessTokenSecret, { expiresIn: "90d" });
  }

  generateRefreshToken(payload: object) {
    return jwt.sign(payload, this.refreshTokenSecret, { expiresIn: "7d" });
  }

  async login(email: string, password: string) {
    let user = await User.findOne({ email });

    if (!user) throw new AppError("User not found", 404);
    if (!user.isActive) throw new AppError("User is not active", 404);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid password", 401);
    }

    const userObj = user.toObject();
    delete (userObj as any).password;
    return {
      accessToken: this.generateAccessToken({
        id: user._id,
        role: user.role,
        companyId: user.companyId,
      }),
      refreshToken: this.generateRefreshToken({
        id: user._id,
        role: user.role,
        companyId: user.companyId,
      }),
      user: userObj,
    };
  }

  async createUser(data: any, performedByUserId?: string) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      ...data,
      password: hashedPassword,
    });

    // Audit: Log create action (use performer's ID or the new user's own ID for self-registration)
    const auditUserId = performedByUserId || user._id.toString();
    await auditService.logCreate(auditUserId, "User", user);

    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj;
  }

  async updateUser(id: string, data: any, performedByUserId?: string) {
    // Get old data for audit diff
    const oldUser = await User.findById(id).lean();
    if (!oldUser) {
      throw new AppError("User not found", 404);
    }

    const user = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Audit: Log update action
    const auditUserId = performedByUserId || id;
    await auditService.logUpdate(
      auditUserId,
      "User",
      id,
      oldUser,
      user.toObject(),
    );

    return user;
  }

  async getUsers(query: any) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sort = "-createdAt",
    } = query;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select("-password"),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  verifyRefreshToken(token: string) {
    try {
      const decoded = jwt.verify(
        token,
        this.refreshTokenSecret,
      ) as CustomJwtPayload;

      const newAccessToken = this.generateAccessToken({
        id: decoded.id,
        role: decoded.role,
        companyId: decoded.companyId,
      });
      return newAccessToken;
    } catch (err) {
      throw new Error("Invalid refresh token");
    }
  }
}

export default new AuthService();
