import { Employee, IEmployee } from "./employee.model";
import { AppError } from "../utils/AppError";
import { CreateEmployeeDto, UpdateEmployeeDto } from "./employee.dto";
import { GetEmployeesQueryRequest } from "./getEmployeesQuery.request";
import ApiFeatures from "../utils/ApiFeatures";
import { deleteFile, uploadFile } from "../utils/S3Uploader";
import auditService from "../audit/audit.service";
import mongoose from "mongoose";
import pdfService from "../utils/PdfService";
import { Company } from "../companies/company.model";

import { BaseQueryRequest } from "../utils/base-query.request";
import { generateSalaryCertificateArHtml } from "./templates/employeeSalaryCertificateAr.template";
import { generateSalaryCertificateEnHtml } from "./templates/employeeSalaryCertificateEn.template";
import { generateTerminationLetterHtml } from "./templates/employeeTerminationLetter.template";
import { generateWorkContractHtml } from "./templates/employeeWorkContract.template";
import { generateWorkContractArHtml } from "./templates/employeeWorkContractAr.template";

class EmployeeService {
  async createEmployee(
    data: CreateEmployeeDto,
    userId: string,

    avatarFile?: Express.Multer.File,
    attachmentFiles?: Express.Multer.File[],
    session?: mongoose.ClientSession,
  ): Promise<IEmployee> {
    const existing = await Employee.findOne({ civilId: data.civilId }).session(
      session || null,
    );
    if (existing)
      throw new AppError("Employee with this Civil ID already exists", 400);

    const employeeData = { ...data };
    if (avatarFile) {
      employeeData.avatar = {
        url: await uploadFile(avatarFile),
      };
    }

    if (attachmentFiles && attachmentFiles.length > 0) {
      employeeData.attachments = [];
      for (const file of attachmentFiles) {
        employeeData.attachments.push({
          name: file.originalname,
          url: await uploadFile(file),
          fileType: file.mimetype,
          uploadedAt: new Date(),
          version: 1,
        });
      }
    }

    // Audit: Log create action

    const newEmployee = await new Employee(employeeData).save({ session });
    await auditService.logCreate(
      userId,
      "Employee",
      newEmployee,
      newEmployee.companyId,
    );
    return newEmployee;
  }

  async getAllEmployees(
    queryReq: GetEmployeesQueryRequest,
  ): Promise<IEmployee[]> {
    const finalFilter = {
      ...queryReq.filter,
      ...queryReq.searchFilter,
      deletedAt: null,
    };

    let mongooseQuery = Employee.find(finalFilter)
      .populate("companyId", "name")
      .populate("userId", "email role");

    const sortBy = queryReq.sort
      ? queryReq.sort.split(",").join(" ")
      : "fullName";
    mongooseQuery = mongooseQuery.sort(sortBy);

    mongooseQuery = ApiFeatures.paginate(
      mongooseQuery,
      queryReq.page,
      queryReq.limit,
    );

    return await mongooseQuery;
  }

  async getEmployeeById(id: string): Promise<IEmployee> {
    const employee = await Employee.findById(id)
      .populate("companyId", "name")
      .populate("userId", "email role");

    if (!employee) throw new AppError("Employee not found", 404);
    return employee;
  }

  async updateEmployee(
    id: string,
    data: UpdateEmployeeDto,
    userId: string,
    newAvatar?: Express.Multer.File,
    newAttachments: Express.Multer.File[] = [],
    session?: mongoose.ClientSession,
  ): Promise<IEmployee> {
    const employee = await Employee.findById(id);
    if (!employee) throw new AppError("Employee not found", 404);
    const oldEmployee = employee.toObject();

    const updatePayload: any = { ...data };

    if (newAvatar) {
      if (employee.avatar?.url) {
        await deleteFile(employee.avatar.url);
      }
      updatePayload.avatar = { url: await uploadFile(newAvatar) };
    }

    if (newAttachments.length > 0) {
      const processedAttachments = await Promise.all(
        newAttachments.map(async (file) => {
          const existingFiles = employee.attachments.filter(
            (a) => a.name === file.originalname,
          );
          const latestVersion =
            existingFiles.length > 0
              ? Math.max(...existingFiles.map((a) => a.version))
              : 0;

          return {
            name: file.originalname,
            url: await uploadFile(file),
            fileType: file.mimetype,
            uploadedAt: new Date(),
            version: latestVersion + 1,
          };
        }),
      );

      const updatedEmployee = await Employee.findByIdAndUpdate(
        id,
        {
          ...updatePayload,
          $push: { attachments: { $each: processedAttachments } },
        },
        { new: true, runValidators: true, session },
      );

      // Audit: Log update action
      await auditService.logUpdate(
        userId,
        "Employee",
        id,
        oldEmployee,
        updatedEmployee!.toObject(),
        updatedEmployee!.companyId,
      );

      return updatedEmployee!;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      updatePayload,
      {
        new: true,
        runValidators: true,
        session,
      },
    );

    // Audit: Log update action
    await auditService.logUpdate(
      userId,
      "Employee",
      id,
      oldEmployee,
      updatedEmployee!.toObject(),
      updatedEmployee!.companyId,
    );

    return updatedEmployee!;
  }

  // incase of adding only attachments after employee creation
  async addEmployeeAttachment(
    employeeId: string,
    file: Express.Multer.File,
  ): Promise<IEmployee> {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError("Employee not found", 404);

    // 1. Find the latest version of this specific file name (if it exists)
    const existingFiles = employee.attachments!.filter(
      (a) => a.name === file.originalname,
    );
    const latestVersion =
      existingFiles.length > 0
        ? Math.max(...existingFiles.map((a) => a.version))
        : 0;

    const url = await uploadFile(file);

    // 3. Push to attachments array as a new version
    employee.attachments!.push({
      name: file.originalname,
      url,
      fileType: file.mimetype,
      uploadedAt: new Date(),
      version: latestVersion + 1,
    });

    return await employee.save();
  }
  async deleteEmployee(id: string, userId: string): Promise<void> {
    const employee = await Employee.findById(id);
    if (!employee) throw new AppError("Employee not found", 404);
    const employeeData = employee.toObject();
    const keysToDelete: string[] = [];
    if (employee.avatar?.url) {
      keysToDelete.push(employee.avatar.url);
    }

    if (employee.attachments && employee.attachments.length > 0) {
      employee.attachments.forEach((att) => {
        if (att.url) keysToDelete.push(att.url);
      });
    }
    if (keysToDelete.length > 0) {
      try {
        await Promise.allSettled(keysToDelete.map((key) => deleteFile(key)));
      } catch (err) {
        console.error("S3 Cleanup failed during employee deletion:", err);
      }
    }
    await Employee.findByIdAndUpdate(id, {
      $set: {
        status: "Terminated",
        deletedAt: new Date(),
      },
    });

    // Audit: Log delete action (soft delete)
    await auditService.logDelete(userId, "Employee", employeeData);

    //console.log(`Employee ${id} archived at ${new Date()}`);
  }

  async getEmployeesByCompanyId(
    companyId: string,
    queryReq: GetEmployeesQueryRequest,
  ): Promise<{ employees: IEmployee[]; total: number }> {
    const finalFilter = {
      ...queryReq.filter,
      ...queryReq.searchFilter,

      companyId: companyId,
    };

    let mongooseQuery = Employee.find(finalFilter);

    const sortBy = queryReq.sort
      ? queryReq.sort.split(",").join(" ")
      : "fullName";
    mongooseQuery = mongooseQuery.sort(sortBy);

    mongooseQuery = ApiFeatures.paginate(
      mongooseQuery,
      queryReq.page,
      queryReq.limit,
    );
    const [employees, total] = await Promise.all([
      mongooseQuery,
      Employee.countDocuments(finalFilter),
    ]);
    return { employees, total };
  }

  async generateWorkContractPdf(
    employeeId: string,
    lang: "ar" | "en-ar" = "en-ar",
  ): Promise<{
    buffer: Buffer;
    employeeName: string;
  }> {
    const employee = await Employee.findById(employeeId).lean();
    if (!employee) throw new AppError("Employee not found", 404);

    const company = await Company.findById(employee.companyId).lean();
    if (!company) throw new AppError("Company not found", 404);

    const [html, headerTemplate, footerTemplate] =
      lang === "ar"
        ? generateWorkContractArHtml(employee as any, company as any)
        : generateWorkContractHtml(employee as any, company as any);

    const buffer = await pdfService.generatePdf({
      html,
      headerTemplate,
      footerTemplate,
    });

    return {
      buffer,
      employeeName: employee.fullName,
    };
  }

  async generateSalaryCertificatePdf(
    employeeId: string,
    lang: "ar" | "en",
  ): Promise<{
    buffer: Buffer;
    employeeName: string;
  }> {
    const employee = await Employee.findById(employeeId).lean();
    if (!employee) throw new AppError("Employee not found", 404);

    const company = await Company.findById(employee.companyId).lean();
    if (!company) throw new AppError("Company not found", 404);

    const [html, headerTemplate, footerTemplate] =
      lang === "ar"
        ? generateSalaryCertificateArHtml(employee as any, company as any)
        : generateSalaryCertificateEnHtml(employee as any, company as any);

    const buffer = await pdfService.generatePdf({
      html,
      headerTemplate,
      footerTemplate,
    });

    return {
      buffer,
      employeeName: employee.fullName,
    };
  }

  async generateTerminationLetterPdf(employeeId: string): Promise<{
    buffer: Buffer;
    employeeName: string;
  }> {
    const employee = await Employee.findById(employeeId).lean();
    if (!employee) throw new AppError("Employee not found", 404);

    const company = await Company.findById(employee.companyId).lean();
    if (!company) throw new AppError("Company not found", 404);

    const [html, headerTemplate, footerTemplate] =
      generateTerminationLetterHtml(employee as any, company as any);

    const buffer = await pdfService.generatePdf({
      html,
      headerTemplate,
      footerTemplate,
    });

    return {
      buffer,
      employeeName: employee.fullName,
    };
  }
}

export default new EmployeeService();
