import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Owner", "Staff", "Client", "HR"]).optional(),
  companyId: z.string().optional(),
});
export const createInternalUserSchema = z.object({
  // User Fields
  fullName: z.string().min(3, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["Owner", "Staff", "Client", "HR"]).default("Staff"),
  companyId: z.string().min(1, "Company ID is required"),

  // Employee Fields
  civilId: z.string().min(1, "Civil ID is required"),
  nationality: z.string().optional(),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().optional(),
  hiringDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  contractType: z.enum(["Limited", "Unlimited", "Project-based"]).optional(),

  salary: z.object({
    basic: z.number().min(0).default(0),
    allowances: z.number().min(0).default(0),
    currency: z.string().default("KWD"),
  }),

  status: z
    .enum(["Active", "On Leave", "Suspended", "Terminated"])
    .default("Active"),
  probationEndDate: z.coerce.date().optional(),
  leaveBalance: z.number().default(0),
  internalNotes: z.string().optional(),
});
export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

export const updateInternalUserSchema = z.object({
  // ===== User Fields =====
  fullName: z.string().min(3).optional(),
  email: z.string().email().optional(),

  role: z.enum(["Owner", "Staff", "Client", "HR"]).optional(),
  companyId: z.string().optional(),

  // ===== Employee Fields =====
  civilId: z.string().optional(),
  nationality: z.string().optional(),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),

  hiringDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),

  contractType: z.enum(["Limited", "Unlimited", "Project-based"]).optional(),

  // 🔥 Salary (accept JSON string OR object)
  salary: z
    .union([
      z.string().transform((val) => JSON.parse(val)),
      z.object({
        basic: z.coerce.number().min(0).optional(),
        allowances: z.coerce.number().min(0).optional(),
        currency: z.string().optional(),
      }),
    ])
    .optional(),

  status: z.enum(["Active", "On Leave", "Suspended", "Terminated"]).optional(),

  probationEndDate: z.coerce.date().optional(),

  leaveBalance: z.coerce.number().optional(),

  internalNotes: z.string().optional(),
});
