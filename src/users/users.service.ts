import { User } from "./user.model";
import { AppError } from "../utils/AppError";
import { BaseQueryRequest } from "../utils/base-query.request";
import bcrypt from "bcrypt";
import { Employee } from "../employee/employee.model";
import mongoose from "mongoose";
import { CreateInternalUserDto, UpdateInternalUserDto } from "./users.dto";
import employeeService from "../employee/employee.service";

import auditService from "../audit/audit.service";

class UserService {
  async getUsers(reqQuery: BaseQueryRequest) {
    const page = Math.max(1, Number(reqQuery.page || 1));
    const limit = Math.min(20, Math.max(1, Number(reqQuery.limit || 10)));
    const skip = (page - 1) * limit;

    const allowedSortFields = ["createdAt", "name", "email"];
    let sortField = "createdAt";
    let sortOrder: 1 | -1 = -1;

    if (reqQuery.sort) {
      const raw = String(reqQuery.sort);
      const field = raw.replace("-", "");

      if (allowedSortFields.includes(field)) {
        sortField = field;
        sortOrder = raw.startsWith("-") ? -1 : 1;
      }
    }

    const userMatch: any = {
      role: { $ne: "Owner" },
      isActive: true,
    };

    if (reqQuery.filter) {
      const { tasks, ...other } = reqQuery.filter;
      Object.assign(userMatch, other);
    }

    if (reqQuery.search) {
      userMatch.$or = [
        { name: { $regex: reqQuery.search, $options: "i" } },
        { email: { $regex: reqQuery.search, $options: "i" } },
      ];
    }

    const taskRanges: Record<string, { min: number; max?: number }> = {
      small: { min: 0, max: 5 },
      medium: { min: 6, max: 10 },
      large: { min: 11 },
    };

    const selectedRange =
      reqQuery.filter?.tasks && taskRanges[String(reqQuery.filter.tasks)]
        ? taskRanges[String(reqQuery.filter.tasks)]
        : null;

    const pipeline: any[] = [
      { $match: userMatch },

      {
        $lookup: {
          from: "tasks",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$assignee", "$$userId"] },
                isDeleted: false,
              },
            },
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                inProgressTasks: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0],
                  },
                },
              },
            },
          ],
          as: "taskStats",
        },
      },

      {
        $addFields: {
          totalTasks: {
            $ifNull: [{ $first: "$taskStats.totalTasks" }, 0],
          },
          inProgressTasks: {
            $ifNull: [{ $first: "$taskStats.inProgressTasks" }, 0],
          },
        },
      },

      {
        $project: {
          password: 0,
          taskStats: 0,
        },
      },
    ];

    if (selectedRange) {
      const match: any = {
        inProgressTasks: { $gte: selectedRange.min },
      };

      if (selectedRange.max !== undefined) {
        match.inProgressTasks.$lte = selectedRange.max;
      }

      pipeline.push({ $match: match });
    }

    pipeline.push({
      $facet: {
        users: [
          { $sort: { [sortField]: sortOrder } },
          { $skip: skip },
          { $limit: limit },
        ],
        total: [{ $count: "count" }],
      },
    });

    const [result] = await User.aggregate(pipeline);

    return {
      users: result?.users ?? [],
      total: result?.total?.[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async createUser(data: any, session?: mongoose.ClientSession) {
    const existingUser = await User.findOne({ email: data.email }, null, {
      session,
    });
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await new User({
      ...data,
      password: hashedPassword,
    }).save({ session });
    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj;
  }
  // This can live in an InternalUserService or similar
  async createInternalUser(
    data: CreateInternalUserDto,
    userId: string,
    files: {
      avatar?: Express.Multer.File;
      attachments?: Express.Multer.File[];
    },
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Create the User Account

      const user = await this.createUser(
        {
          name: data.fullName,
          email: data.email,
          password: data.password,
          role: data.role,
          companyId: data.companyId,
        },
        session,
      );

      // 2. Create the Employee Profile
      // We pass the userId from the newly created user
      const employee = await employeeService.createEmployee(
        {
          ...data,
          userId: user._id.toString(),
        },
        userId,
        files.avatar,
        files.attachments,
        session,
      );

      // 3. Commit everything
      await session.commitTransaction();
      return { user, employee };
    } catch (error) {
      // 4. If User or Employee creation fails, DB changes are rolled back
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  async getInternalUsers(query: BaseQueryRequest) {
    const filterQuery: any = {
      isDeleted: false,
      userId: { $exists: true },
    };

    // 3. Handle search by name or Civil ID
    if (query.search) {
      filterQuery.$or = [
        { fullName: { $regex: query.search, $options: "i" } },
        { civilId: { $regex: query.search, $options: "i" } },
      ];
    }

    Object.assign(filterQuery, query.filter);

    const skip = (query.page - 1) * query.limit;
    const sort = query.sort ? query.sort.split(",").join(" ") : "-createdAt";

    const [users, total] = await Promise.all([
      Employee.find(filterQuery)
        .sort(sort)
        .skip(skip)
        .limit(query.limit)
        .populate("userId", "name email role") // Get user account details
        .lean(),
      Employee.countDocuments(filterQuery),
    ]);

    return { users, total };
  }
  async getUser(id: string) {
    const user = await User.findById(id).select("-password");
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }
  async updateUser(
    id: string,
    data: any,
    session?: mongoose.ClientSession,
    performedBy?: string, // who is doing the update (for audit)
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError("Invalid user ID", 400);
    }

    const user = await User.findById(id).session(session || null);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const oldUser = user.toObject();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        (user as any)[key] = value;
      }
    });

    if (user.modifiedPaths().length === 0) {
      return user;
    }

    const updatedUser = await user.save({ session });

    if (performedBy) {
      await auditService.logUpdate(
        performedBy,
        "User",
        user._id.toString(),
        oldUser,
        updatedUser.toObject(),
        user.companyId,
      );
    }

    return updatedUser;
  }
  async deleteUser(id: string) {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
  }
  async getInternalUser(id: string) {
    // 1. Fetch both concurrently to save time
    const [user, employee] = await Promise.all([
      User.findById(id).select("-password").lean(),
      Employee.findOne({ userId: id }).lean(),
    ]);

    // 2. Check if user exists
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // 3. Check if employee exists (findOne returns null if not found)
    if (!employee) {
      throw new AppError("Employee record not found", 404);
    }

    return {
      ...employee,
      _id: user._id,
      email: user.email,
      role: user.role,
    };
  }
  async updateInternalEmployee(
    userId: string, // The ID of the user being updated
    data: UpdateInternalUserDto,
    currentUserId: string, // The person performing the update
    files: {
      avatar?: Express.Multer.File;
      attachments?: Express.Multer.File[];
    },
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Update the User Account (Identity layer)
      // We separate User fields from the rest of the data
      const { fullName, ...employeeData } = data;

      if (fullName) {
        const updatedUser = await this.updateUser(
          userId,
          {
            name: fullName,
          },
          session,
          currentUserId,
        );

        if (!updatedUser) {
          throw new AppError("User not found", 404);
        }
      }
      const oldEmployee = await Employee.findOne({ userId: userId }).lean();
      if (!oldEmployee) {
        throw new AppError("Employee not found", 404);
      }

      const employee = await employeeService.updateEmployee(
        oldEmployee!._id.toString(),
        { fullName, ...employeeData },
        currentUserId,
        files.avatar,
        files.attachments,
        session,
      );

      await session.commitTransaction();
      return { employee };
    } catch (error) {
      // 4. Rollback on any failure (DB or File Upload)
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  async deleteInternalEmployee(id: string, performedBy: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(id).session(session);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const employee = await Employee.findOne({ userId: id }).session(session);
      if (!employee) {
        throw new AppError("Employee record not found", 404);
      }

      const oldUser = user.toObject();
      const oldEmployee = employee.toObject();

      user.isActive = false;
      employee.status = "Terminated";
      employee.deletedAt = new Date();
      await Promise.all([
        user.save({ session }),
        employee.save({ session }),
        await auditService.logDelete(performedBy, "User", oldUser),
        await auditService.logDelete(performedBy, "Employee", oldEmployee),
      ]);

      await session.commitTransaction();

      return { user, employee };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default new UserService();
