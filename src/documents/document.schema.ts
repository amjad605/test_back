import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  docType: z.string().min(1, "Document type is required"),
  docNumber: z.string().optional(),
  ownerType: z.enum(["Company", "Employee"]),
  ownerId: z.string().min(1, "Owner ID is required"),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  nextRenewalDate: z.string().optional(),
  estimatedFee: z
    .object({
      amount: z.number().optional(),
      currency: z.string().default("KWD"),
    })
    .optional(),
  actualFee: z.number().optional(),
  status: z
    .enum(["Valid", "Expiring Soon", "Expired", "Under Renewal", "On Hold"])
    .default("Valid"),
  isInternalOnly: z.boolean().default(false),
  assignedTo: z.string().optional(),
  internalNotes: z.string().optional(),
  customFields: z
    .array(
      z.object({
        name: z.string(),
        value: z.string().optional().default(""),
        type: z.string(),
      }),
    )
    .optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();
