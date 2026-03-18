import { z } from "zod";

export const CreateTaskSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),

  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),

  dueDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .refine(
      (date) => {
        if (!date) return true; // If it's optional and empty, it's valid

        // Get "today" but set time to 00:00:00 to allow tasks for the current day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date >= today;
      },
      {
        message: "The due date cannot be in the past",
      },
    ),

  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),

  status: z
    .enum([
      "Open",
      "In Progress",
      "Waiting",
      "Completed",
      "Cancelled",
      "Archived",
    ])
    .default("Open"),

  employeeId: z.string().optional(),
  documentId: z.string().optional(),
  requestId: z.string().optional(),

  assignee: z.string().optional(),

  workflowStep: z.string().optional(),

  type: z
    .enum([
      "Document Expiry",
      "Renewal Workflow",
      "Missing Document",
      "Client Request",
      "HR",
      "General",
    ])
    .default("General"),

  isClientVisible: z.boolean().default(false),

  estimatedFee: z.number().nonnegative().optional(),
  actualFee: z.number().nonnegative().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();
