import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export interface IS3File {
  url: string;
}
export interface IAttachment extends IS3File {
  name: string;
  uploadedAt: Date;
  fileType?: string;
  version: number;
}
export interface IEmployee extends MongooseDocument {
  fullName: string;
  civilId: string;
  nationality?: string;
  phoneNumber?: string;
  companyId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  jobTitle: string;
  department?: string;
  hiringDate?: Date;
  contractType?: "Limited" | "Unlimited" | "Project-based";
  salary: {
    basic: number;
    allowances: number;
    currency: string;
  };
  status: "Active" | "On Leave" | "Suspended" | "Terminated";
  probationEndDate?: Date;
  leaveBalance: number;
  internalNotes?: string;
  avatar?: IS3File;
  attachments: IAttachment[];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    fullName: { type: String, required: true },
    civilId: { type: String, required: true, unique: true },
    nationality: String,
    phoneNumber: String,
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    jobTitle: { type: String, required: true },
    department: String,
    hiringDate: Date,
    contractType: {
      type: String,
      enum: ["Limited", "Unlimited", "Project-based"],
    },
    salary: {
      basic: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      currency: { type: String, default: "KWD" },
    },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Suspended", "Terminated"],
      default: "Active",
    },
    probationEndDate: Date,
    leaveBalance: { type: Number, default: 0 },
    internalNotes: String,
    avatar: {
      url: String,
    },
    attachments: [
      {
        name: String,
        url: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now },
        version: { type: Number, default: 1 },
      },
    ],
    deletedAt: { type: Date, default: null }, // For Soft Delete
  },
  { timestamps: true },
);

EmployeeSchema.index({ fullName: "text", civilId: 1 });

export const Employee = model<IEmployee>("Employee", EmployeeSchema);
