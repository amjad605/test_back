import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(3),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  licenseNumber: z.string().min(1),
  managerName: z.string().optional(),
  issueDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  expiryDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  customFields: z
    .preprocess(
      (val) => {
        if (typeof val === "string") return JSON.parse(val);
        return val;
      },
      z.array(
        z.object({
          type: z.enum(["Date", "Number", "Text"]),
          name: z.string(),
          value: z.string(),
        }),
      ),
    )
    .optional(),
});

export const updateCompanySchema = createCompanySchema.partial();
