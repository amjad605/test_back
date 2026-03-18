import { Response } from "express";
import employeeService from "./employee.service";
import { AsyncWrapper } from "../utils/AsyncWrapper";
import { CreateEmployeeDto, UpdateEmployeeDto } from "./employee.dto";
import { GetEmployeesQueryRequest } from "./getEmployeesQuery.request";
import { validateInput } from "../utils/validationErrors";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "./employee.validation";
import { AuthenticatedRequest } from "../auth/auth.service";

class EmployeeController {
  create = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    const validatedBody = validateInput(
      createEmployeeSchema,
      req.body,
    ) as CreateEmployeeDto;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const avatarFile = files?.avatar ? files.avatar[0] : undefined;
    const attachmentFiles = files?.attachments || [];
    const employee = await employeeService.createEmployee(
      validatedBody,
      req.user!.id,
      avatarFile,
      attachmentFiles,
    );

    res.status(201).json({ status: "success", data: { employee } });
  });

  getAll = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    const employeeQuery = new GetEmployeesQueryRequest(req.query);
    const employees = await employeeService.getAllEmployees(employeeQuery);

    res.status(200).json({
      status: "success",
      results: employees.length,
      pagination: {
        page: employeeQuery.page,
        limit: employeeQuery.limit,
      },
      data: { employees },
    });
  });

  getOne = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.status(200).json({ status: "success", data: { employee } });
  });

  update = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    const validatedBody = validateInput(
      updateEmployeeSchema,
      req.body,
    ) as UpdateEmployeeDto;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const avatar = files?.avatar ? files.avatar[0] : undefined;
    const attachments = files?.attachments || [];

    const employee = await employeeService.updateEmployee(
      req.params.id,
      validatedBody,
      req.user!.id,
      avatar,
      attachments,
    );

    res.status(200).json({ status: "success", data: { employee } });
  });

  delete = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    await employeeService.deleteEmployee(req.params.id, req.user!.id);
    res.status(204).json({ status: "success", data: null });
  });

  getEmployeesByCompanyId = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const employeeQuery = new GetEmployeesQueryRequest(req.query);
      const { employees, total } =
        await employeeService.getEmployeesByCompanyId(
          req.params.companyId,
          employeeQuery,
        );
      res.status(200).json({
        status: "success",
        results: employees.length,
        total,
        pagination: {
          page: employeeQuery.page,
          limit: employeeQuery.limit,
        },
        data: employees,
      });
    },
  );

  exportWorkContract = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const lang = (req.params.lang as "ar" | "en-ar") || "en-ar";
      const { buffer, employeeName } =
        await employeeService.generateWorkContractPdf(req.params.id, lang);

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Work_Contract_${lang.toUpperCase()}_${employeeName.replace(/\s+/g, "_")}.pdf`,
        "Content-Length": buffer.length,
      });

      res.status(200).send(buffer);
    },
  );

  exportSalaryCertificate = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const language = req.params.lang as "ar" | "en";
      const { buffer, employeeName } =
        await employeeService.generateSalaryCertificatePdf(
          req.params.id,
          language,
        );

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Salary_Certificate_${language.toUpperCase()}_${employeeName.replace(/\s+/g, "_")}.pdf`,
        "Content-Length": buffer.length,
      });

      res.status(200).send(buffer);
    },
  );

  exportTerminationLetter = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      const { buffer, employeeName } =
        await employeeService.generateTerminationLetterPdf(req.params.id);

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Termination_Letter_${employeeName.replace(/\s+/g, "_")}.pdf`,
        "Content-Length": buffer.length,
      });

      res.status(200).send(buffer);
    },
  );
}

export default new EmployeeController();
