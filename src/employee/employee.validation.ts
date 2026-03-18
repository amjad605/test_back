import { z } from "zod";

export const createEmployeeSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  civilId: z.string().length(12, "Civil ID must be exactly 12 digits"),
  companyId: z.string().min(1, "Company ID is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  salary: z
    .object({
      basic: z.number().min(0),
      allowances: z.number().min(0).default(0),
      currency: z.string().default("KWD"),
    })
    .optional(),
  status: z
    .enum(["Active", "On Leave", "Suspended", "Terminated"])
    .default("Active"),
  hiringDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();
