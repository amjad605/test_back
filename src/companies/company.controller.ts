import { Response } from "express";
import { AsyncWrapper } from "../utils/AsyncWrapper";
import { BaseQueryRequest } from "../utils/base-query.request";
import { validateInput } from "../utils/validationErrors";
import companyService from "./company.service";
import { createCompanySchema, updateCompanySchema } from "./company.validation";
import { AuthenticatedRequest } from "../auth/auth.service";

class CompanyController {
  create = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    if (typeof req.body.partners === "string") {
      req.body.partners = JSON.parse(req.body.partners);
    }
    const validatedBody = validateInput(createCompanySchema, req.body);
    const attachmentFiles = req.files as Express.Multer.File[];

    const company = await companyService.createCompany(
      validatedBody,
      req.user!.id,
      req.user,
      attachmentFiles,
    );

    res.status(201).json({ status: "success", data: { company } });
  });
  getAll = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    const companyQuery = new BaseQueryRequest(req.query);
    const { companies, total } =
      await companyService.getAllCompanies(companyQuery);

    res.status(200).json({
      status: "success",
      results: companies.length,
      total,
      data: companies,
    });
  });

  getOne = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    const company = await companyService.getCompanyById(req.params.id);
    res.status(200).json({
      status: "success",
      data: company,
    });
  });

  update = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    const validatedBody = validateInput(updateCompanySchema, req.body);
    const company = await companyService.updateCompany(
      req.params.id,
      validatedBody,
      req.user!.id,
    );
    res.status(200).json({ status: "success", data: { company } });
  });

  delete = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    await companyService.deleteCompany(req.params.id, req.user!.id);
    res.status(204).json({
      status: "success",
      data: null,
    });
  });

  exportPdf = AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    const { buffer, companyName } = await companyService.generateCompanyPdf(
      req.params.id,
    );

    const sanitizedName = companyName.replace(/[^a-zA-Z0-9-_]/g, "_");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="company-${sanitizedName}.pdf"`,
      "Content-Length": buffer.length,
    });

    res.send(buffer);
  });
}

export default new CompanyController();
