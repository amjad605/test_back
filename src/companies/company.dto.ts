import { Schema } from "mongoose";

export interface CreateCompanyDto {
  name: string;
  licenseNumber?: string;
  managerName?: string;
  partners?: string[];
  industry?: string;
  address?: string;
  missingDocsChecklist?: {
    docType: string;
    isRequired: boolean;
  }[];
}

export interface UpdateCompanyDto {
  name?: string;
  licenseNumber?: string;
  managerName?: string;
  partners?: string[];
  industry?: string;
  address?: string;
  missingDocsChecklist?: {
    docType: string;
    isRequired: boolean;
  }[];
  documents?: string[];
}

export interface CompanyResponseDto extends CreateCompanyDto {
  _id: string;
  documents: any[];
  createdAt: Date;
  updatedAt: Date;
}
