import { Router } from "express";
import employeeController from "./employee.controller";
import { upload } from "../utils/multer";
import authController from "../auth/auth.controller";

const employeeRouter = Router();

employeeRouter.use(authController.authenticateToken);
employeeRouter
  .route("/")
  .post(
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "attachments", maxCount: 10 }, // adjust maxCount
    ]),
    authController.authorizeOwner,

    employeeController.create,
  )
  .get(employeeController.getAll);
employeeRouter.get(
  "/company/:companyId",
  employeeController.getEmployeesByCompanyId,
);
employeeRouter.route("/:id").get(employeeController.getOne);
employeeRouter.get(
  "/:id/export-work-contract/:lang?",
  employeeController.exportWorkContract,
);
employeeRouter.get(
  "/:id/export-salary-certificate/:lang",
  employeeController.exportSalaryCertificate,
);
employeeRouter.get(
  "/:id/export-termination-letter",
  employeeController.exportTerminationLetter,
);
employeeRouter
  .route("/:id")
  .patch(
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "attachments", maxCount: 10 }, // adjust maxCount
    ]),
    authController.authorizeOwner,
    employeeController.update,
  )
  .delete(authController.authorizeOwner, employeeController.delete);

export default employeeRouter;
