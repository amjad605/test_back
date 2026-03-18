import { Company, ICompany } from "./company.model";
import { AppError } from "../utils/AppError";
import { CreateCompanyDto, UpdateCompanyDto } from "./company.dto";
import ApiFeatures from "../utils/ApiFeatures";
import { BaseQueryRequest } from "../utils/base-query.request";
import auditService from "../audit/audit.service";
import { Document } from "../documents/document.model";
import mongoose from "mongoose";
import { Employee } from "../employee/employee.model";
import { uploadFile } from "../utils/S3Uploader";
import documentService from "../documents/document.service";
import pdfService from "../utils/PdfService";
import { generateCompanyPdfHtml } from "./company.template";

class CompanyService {
  async createCompany(
    data: any,
    userId: string,
    user: any,
    attachmentFiles?: Express.Multer.File[],
  ): Promise<ICompany> {
    const existing = await Company.findOne({ name: data.name });
    if (existing) throw new AppError("Company name already exists", 400);

    const newCompany = await Company.create(data);
    if (attachmentFiles && attachmentFiles.length > 0) {
      for (const file of attachmentFiles) {
        const fileUrl = await uploadFile(file);

        const docData = {
          title: `${newCompany.name} - ${file.originalname}`,
          docType: "General",
          ownerType: "Company",
          ownerId: newCompany._id,
          status: "Valid",
          attachments: [
            {
              fileUrl: fileUrl,
              version: 1,
              uploadedAt: new Date(),
            },
          ],
        };
        const doc = await documentService.createDocument(docData, user);
        newCompany.documents.push(doc._id as any);
      }
      await newCompany.save();
    }
    await auditService.logCreate(userId, "Company", newCompany, newCompany.id);

    return newCompany;
  }
  async getAllCompanies(
    reqQuery: BaseQueryRequest,
  ): Promise<{ companies: ICompany[]; total: number }> {
    let filterQuery = {};

    if (Object.keys(reqQuery.filter).length > 0) {
      filterQuery = { ...filterQuery, ...reqQuery.filter };
    }

    if (reqQuery.search) {
      filterQuery = {
        ...filterQuery,
        name: { $regex: reqQuery.search, $options: "i" },
      };
    }

    const total = await Company.countDocuments(filterQuery);

    let mongooseQuery = Company.find(filterQuery);

    const sortBy = reqQuery.sort
      ? reqQuery.sort.split(",").join(" ")
      : "-createdAt";
    mongooseQuery = mongooseQuery.sort(sortBy);

    mongooseQuery = ApiFeatures.paginate(
      mongooseQuery,
      reqQuery.page,
      reqQuery.limit,
    );

    const companies = await mongooseQuery;
    return { companies, total };
  }

  async getCompanyById(id: string): Promise<{
    stats: {
      expired: number;
      expiringSoon: number;
      missing: number;
      estimatedFee: number;
      totalDocuments: number;
      totalEmployees: number;
    };
    company: ICompany;
  }> {
    const companyObjectId = new mongoose.Types.ObjectId(id);

    const [docStats, totalEmployees, company] = await Promise.all([
      Document.aggregate([
        { $match: { ownerId: companyObjectId } },
        {
          $group: {
            _id: null,
            expired: {
              $sum: { $cond: [{ $eq: ["$status", "no-expiring"] }, 1, 0] },
            },
            expiringSoon: {
              $sum: { $cond: [{ $eq: ["$status", "expiring-soon"] }, 1, 0] },
            },
            missing: {
              $sum: { $cond: [{ $eq: ["$status", "missing"] }, 1, 0] },
            },
            estimatedFee: { $sum: "$estimatedFee.amount" },
            totalDocuments: { $sum: 1 },
          },
        },
      ]),
      Employee.countDocuments({ companyId: id }),
      Company.findById(id).lean(),
    ]);

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    // Handle case where company has no documents yet
    const stats = docStats[0] || {
      expired: 0,
      expiringSoon: 0,
      missing: 0,
      estimatedFee: 0,
      totalDocuments: 0,
    };

    return {
      stats: {
        ...stats,
        totalEmployees,
      },
      company: company,
    };
  }
  async updateCompany(
    id: string,
    data: UpdateCompanyDto,
    userId: string,
  ): Promise<ICompany> {
    // Get old data for audit diff
    const oldCompany = await Company.findById(id).lean();
    if (!oldCompany) throw new AppError("Company not found", 404);

    const company = await Company.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!company) throw new AppError("Company not found", 404);

    // Audit: Log update action with diff
    await auditService.logUpdate(
      userId,
      "Company",
      id,
      oldCompany,
      company.toObject(),
      company._id || company.id,
    );

    return company;
  }

  async deleteCompany(id: string, userId: string): Promise<void> {
    // Get company data before deletion for audit
    const company = await Company.findById(id).lean();
    if (!company) throw new AppError("Company not found", 404);

    await Company.findByIdAndDelete(id);

    // Audit: Log delete action
    await auditService.logDelete(userId, "Company", company);
  }

  async generateCompanyPdf(companyId: string): Promise<{
    buffer: Buffer;
    companyName: string;
  }> {
    // 1. Fetch the company
    const company = await Company.findById(companyId).lean();
    if (!company) {
      throw new AppError("Company not found", 404);
    }

    // 2. Fetch employees for this company (exclude soft-deleted)
    const employees = await Employee.find({
      companyId: companyId,
      deletedAt: null,
    })
      .sort({ fullName: 1 })
      .lean();

    // 3. Generate the HTML template
    const [html, headerTemplate, footerTemplate] = generateCompanyPdfHtml(
      company as any,
      employees as any,
    );

    // 4. Generate PDF using PdfService
    const buffer = await pdfService.generatePdf({
      html,
      headerTemplate,
      footerTemplate,
    });

    return {
      buffer,
      companyName: company.name,
    };
  }
}

export default new CompanyService();
