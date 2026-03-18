import { Router } from "express";
import companyController from "./company.controller";
import { upload } from "../utils/multer";
import authController from "../auth/auth.controller";

const companyRouter = Router();

companyRouter.use(authController.authenticateToken);

companyRouter
  .route("/")
  .post(upload.array("documents"), companyController.create)
  .get(companyController.getAll);

companyRouter.get("/:id/export-pdf", companyController.exportPdf);

companyRouter
  .route("/:id")
  .get(companyController.getOne)
  .patch(upload.array("documents"), companyController.update)
  .delete(companyController.delete);

export default companyRouter;
