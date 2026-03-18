import { Schema, model } from "mongoose";

const DocumentSchema = new Schema(
  {
    title: { type: String, required: true },
    docType: { type: String, required: true },
    docNumber: String,

    ownerType: { type: String, enum: ["Company", "Employee"], required: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      refPath: "ownerType",
      required: true,
    },

    issueDate: Date,
    expiryDate: Date,
    nextRenewalDate: Date,

    estimatedFee: {
      amount: Number,
      currency: { type: String, default: "KWD" },
    },
    actualFee: Number,

    attachments: [
      {
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
        version: Number,
      },
    ],

    status: {
      type: String,
      enum: ["Valid", "Expiring Soon", "Expired", "Under Renewal", "On Hold"],
      default: "Valid",
    },
    isInternalOnly: { type: Boolean, default: false },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    internalNotes: String,
    customFields: [
      {
        name: String,
        value: String,
        type: { type: String },
      },
    ],
  },
  { timestamps: true },
);

export const Document = model("Document", DocumentSchema);
