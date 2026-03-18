import { AppError } from "../utils/AppError";
import { BaseQueryRequest } from "../utils/base-query.request";
import { CreateTaskDto, UpdateTasksDto } from "./tasks.dto";
import { ITaskAttachment, Task } from "./tasks.model";
import { deleteFile, uploadFile } from "../utils/S3Uploader";
import auditService from "../audit/audit.service";
import { Types } from "mongoose";

class TasksService {
  async createTask(
    dto: CreateTaskDto,
    attachments: Express.Multer.File[],
    user: any,
  ) {
    if (attachments && attachments.length > 0) {
      dto.attachments = [];
      for (const file of attachments) {
        const url = await uploadFile(file);
        const attachment = {
          name: file.originalname,
          url,
          uploadedAt: new Date(),
          uploadedBy: user._id,
          isInternalOnly: true,
        };
        dto.attachments.push(attachment);
      }
    }

    const task = await Task.create({
      ...dto,
      company: user.role !== "Client" ? dto.companyId : user.company,
      createdBy: user.id || null,
      status: "Open",
      isSystemGenerated: false,
      source: "Manual",
    });

    // Audit: Log create action
    await auditService.logCreate(
      user.id || user._id,
      "Task",
      task,
      task.company,
    );

    return task;
  }

  async getAllTasks(query: BaseQueryRequest, user: any) {
    const now = new Date();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay(),
    );

    const baseFilter: any = {
      isDeleted: false,
      ...(user.role === "Client" && { isClientVisible: true }),
      ...((user.role === "Staff" || user.role === "HR") && {
        assignee: user.id,
      }),
      ...query.filter,
    };

    const listFilter = { ...baseFilter };
    if (query.search) {
      listFilter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [tasks, total, statsArray] = await Promise.all([
      Task.find(listFilter)
        .sort("-createdAt")
        .skip(skip)
        .limit(query.limit)
        .populate("assignee company", "name")
        .lean(),

      Task.countDocuments(listFilter),

      // Calculate Stats in one aggregation hit (Most efficient)
      Task.aggregate([
        {
          $match: {
            isDeleted: false,
            ...((user.role === "Staff" || user.role === "HR") && {
              assignee: new Types.ObjectId(user.id),
            }),
          },
        },
        {
          $group: {
            _id: null,

            pending: {
              $sum: { $cond: [{ $eq: ["$status", "Open"] }, 1, 0] },
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
            },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $not: [
                          {
                            $in: [
                              "$status",
                              ["Completed", "Cancelled", "Archived"],
                            ],
                          },
                        ],
                      },
                      { $lt: ["$dueDate", now] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            completedThisWeek: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "Completed"] },
                      { $gte: ["$updatedAt", startOfWeek] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);
    // Format stats (handle empty case if no tasks exist)
    const stats = statsArray[0] || {
      pending: 0,
      inProgress: 0,
      overdue: 0,
      completedThisWeek: 0,
    };

    // 4. Sanitize and Return
    const sanitizedTasks = tasks.map((task) => this.sanitizeTask(task, user));

    return {
      tasks: sanitizedTasks,
      total,
      stats,
    };
  }

  async getTaskById(id: string, user: any) {
    const query: any = { _id: id, isDeleted: false };
    if (user.role === "Client") query.company = user.company;

    const task = await Task.findOne(query)
      .populate("assignee company", "name")
      .lean();

    if (!task) throw new AppError("Task not found", 404);

    // Ensure client doesn't see internal data
    return this.sanitizeTask(task, user);
  }

  // Helper to satisfy the "Internal-only hidden from clients" requirement
  private sanitizeTask(task: any, user: any) {
    if (user.role === "Client") {
      task.notes = task.notes?.filter((n: any) => !n.isInternalOnly);
      task.attachments = task.attachments?.filter(
        (a: any) => !a.isInternalOnly,
      );
    }
    return task;
  }

  async updateTask(id: string, dto: UpdateTasksDto, user: any) {
    // SECURITY: Ensure user owns the task they are updating
    const query: any = { _id: id, isDeleted: false };

    // Get old data for audit diff
    const oldTask = await Task.findOne(query).lean();
    if (!oldTask) throw new AppError("Task not found", 404);

    const task = await Task.findOneAndUpdate(query, dto, { new: true });
    if (!task) throw new AppError("Task not found", 404);

    // Audit: Log update action
    await auditService.logUpdate(
      user.id || user._id,
      "Task",
      id,
      oldTask,
      task.toObject(),
      task.company,
    );

    return task;
  }

  async deleteTask(id: string, user: any) {
    // FIXED: Added company check to prevent cross-tenant deletion
    const query: any = { _id: id, isDeleted: false };
    if (user.role !== "Owner") query.company = user.company;

    // Get task data before deletion for audit
    const taskData = await Task.findOne(query).lean();
    if (!taskData) throw new AppError("Task not found", 404);

    const task = await Task.findOneAndUpdate(
      query,
      { isDeleted: true, deletedAt: new Date(), deletedBy: user._id },
      { new: true },
    );

    if (!task) throw new AppError("Task not found", 404);

    if (task.attachments && task.attachments.length > 0) {
      await Promise.all(
        task.attachments.map(async (attachment: ITaskAttachment) => {
          await deleteFile(attachment.url);
        }),
      );
    }

    // Audit: Log delete action (soft delete)
    await auditService.logDelete(user.id || user._id, "Task", taskData);

    return task;
  }

  async addAttachment(
    taskId: string,
    file: Express.Multer.File,
    user: any,
    isInternal: boolean = true,
  ) {
    const fileUrl = await uploadFile(file);

    const attachment = {
      fileName: file.originalname,
      fileUrl,
      uploadedAt: new Date(),
      uploadedBy: user._id,
      isInternalOnly: isInternal, // Requirement: distinguish internal docs
    };

    const task = await Task.findOneAndUpdate(
      { _id: taskId, isDeleted: false, company: user.company },
      { $push: { attachments: attachment } },
      { new: true },
    );

    if (!task) throw new AppError("Task not found", 404);
    return task;
  }
  async getMyTasks(user: any, query: BaseQueryRequest) {
    const filter: any = { isDeleted: false, company: user.company };

    if (user.role === "Client") {
      filter.isClientVisible = true;
    } else if (user.role === "Staff") {
      filter.assignee = user._id;
    }

    const skip = (query.page - 1) * query.limit;
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort("-createdAt").skip(skip).limit(query.limit).lean(),
      Task.countDocuments(filter),
    ]);
    const sanitizedTasks = tasks.map((task) => this.sanitizeTask(task, user));

    return { tasks: sanitizedTasks, total };
  }

  async addNote(taskId: string, text: string, isInternal: boolean, user: any) {
    const note = {
      text,
      addedBy: user._id,
      addedAt: new Date(),
      isInternalOnly: isInternal, // Doc requirement: Internal-only notes hidden from clients
    };

    const task = await Task.findOneAndUpdate(
      { _id: taskId, isDeleted: false, company: user.company },
      { $push: { notes: note } },
      { new: true },
    ).lean();

    if (!task) throw new AppError("Task not found", 404);

    // Log the action in Audit Log

    return this.sanitizeTask(task, user);
  }
}

export default new TasksService();
