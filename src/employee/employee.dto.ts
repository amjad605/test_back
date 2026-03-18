import { Schema } from "mongoose";
import { IAttachment, IS3File } from "./employee.model";

export interface CreateEmployeeDto {
  fullName: string;
  civilId: string;
  jobTitle: string;
  companyId: string;
  userId?: string;
  nationality?: string;
  phoneNumber?: string;
  department?: string;
  hiringDate?: Date;
  salary?: {
    basic: number;
    allowances: number;
  };
  internalNotes?: string;
  avatar?: IS3File;
  attachments?: IAttachment[];
  deletedAt?: Date | null;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  status?: "Active" | "On Leave" | "Suspended" | "Terminated";
}
