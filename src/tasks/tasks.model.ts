import { model, Schema, Types } from "mongoose";

export type TaskStatus =
  | "Open"
  | "In Progress"
  | "On Hold"
  | "Completed"
  | "Cancelled"
  | "Archived";

export type TasksPriority = "Low" | "Medium" | "High" | "Urgent";

export type TaskType =
  | "Document Expiry"
  | "Renewal Workflow"
  | "Missing Document"
  | "Client Request"
  | "HR"
  | "General";

export type TaskSource = "Manual" | "Expiry Engine" | "Workflow";

export interface ITaskAttachment {
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: Types.ObjectId;
  isInternal?: boolean;
}

export interface ITaskNote {
  text: string;
  addedBy: Types.ObjectId;
  addedAt: Date;
  isInternal?: boolean;
}

export interface ITask {
  company: Types.ObjectId;
  employee?: Types.ObjectId | null;
  document?: Types.ObjectId | null;

  workflowStep?: string | null;

  title: string;
  description?: string;
  type: TaskType;
  priority: TasksPriority;
  assignee: Types.ObjectId;
  createdBy?: Types.ObjectId;
  dueDate?: Date;
  completedAt?: Date | null;

  status: TaskStatus;
  estimatedFee?: number; // ADDED: To track fees per renewal task
  actualFee?: number; // ADDED: For Finance-lite tracking
  isClientVisible: boolean;
  attachments?: ITaskAttachment[];
  notes?: ITaskNote[];
  isSystemGenerated: boolean;
  source: TaskSource;
  deliverable?: string;

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

const TaskSchema = new Schema(
  {
    company: {
      type: Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    employee: {
      type: Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    document: {
      type: Types.ObjectId,
      ref: "Document",
      default: null,
    },

    workflowStep: {
      type: String, // e.g. "Docs Received", "Submitted", etc.
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: [
        "Document Expiry",
        "Renewal Workflow",
        "Missing Document",
        "Client Request",
        "HR",
        "General",
      ],
      default: "General",
      index: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },

    assignee: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    dueDate: {
      type: Date,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "Open",
        "In Progress",
        "Waiting",
        "Completed",
        "Cancelled",
        "Archived",
      ],
      default: "Open",
      index: true,
    },
    isClientVisible: {
      type: Boolean,
      default: false, // Default to internal for safety
    },

    estimatedFee: {
      type: Number,
      default: 0,
    },

    actualFee: {
      type: Number,
      default: 0,
    },

    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: Types.ObjectId, ref: "User" },
        isInternal: { type: Boolean, default: true },
      },
    ],

    notes: [
      {
        text: String,
        addedBy: { type: Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
        isInternal: { type: Boolean, default: true },
      },
    ],

    isSystemGenerated: {
      type: Boolean,
      default: false,
    },

    source: {
      type: String,
      default: "Manual",
    },

    deliverable: {
      type: String,
      default: "",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: Date,
    deletedBy: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Task = model<ITask>("Task", TaskSchema);
