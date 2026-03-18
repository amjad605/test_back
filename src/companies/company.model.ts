import { Schema, model, Document as MongooseDocument } from "mongoose";
import { IAttachment, IS3File } from "../employee/employee.model";

export interface ICustomField {
  type: "Date" | "Number" | "Text";
  name: string;
  value: string;
}

export interface ICompany extends MongooseDocument {
  name: string;
  email?: string;
  phoneNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  customFields: ICustomField[];
  attachments: IAttachment[];
  licenseNumber?: string;
  managerName?: string;
  partners: string[];
  industry?: string;
  address?: string;
  missingDocsChecklist: {
    docType: string;
    isRequired: boolean;
  }[];
  documents: Schema.Types.ObjectId[];
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    email: String,
    phoneNumber: String,
    licenseNumber: String,
    issueDate: Date,
    expiryDate: Date,
    managerName: String,
    industry: String,
    address: String,
    partners: [String],
    missingDocsChecklist: [
      {
        docType: String,
        isRequired: { type: Boolean, default: true },
      },
    ],
    documents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    customFields: [
      {
        type: { type: String, enum: ["Date", "Number", "Text"] },
        name: String,
        value: String,
      },
    ],
  },
  { timestamps: true },
);

export const Company = model<ICompany>("Company", CompanySchema);
