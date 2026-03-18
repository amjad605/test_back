import { Router } from "express";
import documentController from "./document.controller";
import authController from "../auth/auth.controller";
import { upload } from "../utils/multer";

const documentRouter = Router();

documentRouter.use(authController.authenticateToken);

documentRouter.get("/", documentController.getDocuments);

documentRouter.get("/:id", documentController.getDocumentById);
documentRouter.get("/company/:id", documentController.getDocumentsByCompanyId);
documentRouter.post(
  "/",
  upload.array("files"),
  documentController.createDocument,
);

documentRouter.patch(
  "/:id",
  upload.array("files"),
  authController.authorizeManagement,
  documentController.updateDocument,
);

documentRouter.post(
  "/:id/attachments",
  upload.array("files"),
  authController.authorizeManagement,
  documentController.addAttachment,
);

documentRouter.delete(
  "/:id",
  authController.authorizeOwner,
  documentController.deleteDocument,
);

documentRouter.get("/:id/download", documentController.downloadDocument);

export default documentRouter;
