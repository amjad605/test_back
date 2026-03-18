import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../auth/auth.service";
import { AppError } from "../utils/AppError";
import { AsyncWrapper } from "../utils/AsyncWrapper";
import { uploadFile } from "../utils/S3Uploader";
import { validateInput } from "../utils/validationErrors";
import { createDocumentSchema, updateDocumentSchema } from "./document.schema";
import documentService from "./document.service";

class DocumentController {
  getDocuments = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const result = await documentService.getDocuments(req.query, req.user);
      return res.status(200).json({ status: "success", ...result });
    },
  );

  getDocumentById = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const doc = await documentService.getDocumentById(
        req.params.id,
        req.user,
      );
      return res
        .status(200)
        .json({ status: "success", data: { document: doc } });
    },
  );
  getDocumentsByCompanyId = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const result = await documentService.getDocumentsByCompanyId(
        req.params.id,
        req.query,
      );
      return res.status(200).json({ status: "success", ...result });
    },
  );
  createDocument = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // Reconstruct nested objects if sent via FormData
      const preparedData = documentService.prepareDocumentData(req.body);
      const validatedData = validateInput(createDocumentSchema, preparedData);

      const doc = await documentService.createDocument(validatedData, req.user);

      // If there are files, upload them as attachments
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        for (const file of files) {
          const fileUrl = await uploadFile(file);
          await documentService.addAttachment(doc._id.toString(), fileUrl);
        }
      }

      return res
        .status(201)
        .json({ status: "success", data: { document: doc } });
    },
  );

  updateDocument = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const preparedData = documentService.prepareDocumentData(req.body);
      const validatedData = validateInput(updateDocumentSchema, preparedData);
      const doc = await documentService.updateDocument(
        req.params.id,
        validatedData,
        req.user!.id,
      );

      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        for (const file of files) {
          const fileUrl = await uploadFile(file);
          await documentService.addAttachment(doc._id.toString(), fileUrl);
        }
      }

      return res
        .status(200)
        .json({ status: "success", data: { document: doc } });
    },
  );

  addAttachment = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0)
        throw new AppError("No files uploaded", 400);

      const uploadedDocs = [];
      for (const file of files) {
        const fileUrl = await uploadFile(file);
        const updatedDoc = await documentService.addAttachment(
          req.params.id,
          fileUrl,
        );
        uploadedDocs.push(updatedDoc);
      }

      return res.status(200).json({
        status: "success",
        data: { document: uploadedDocs[uploadedDocs.length - 1] },
      });
    },
  );

  deleteDocument = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      await documentService.deleteDocument(req.params.id, req.user!.id);
      return res.status(204).json({ status: "success", data: null });
    },
  );

  downloadDocument = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const doc = await documentService.getDocumentById(
        req.params.id,
        req.user,
      );

      // Additional check for client download
      if (req.user?.role === "Client" && doc.isInternalOnly) {
        throw new AppError("Forbidden: Internal document", 403);
      }

      const latestAttachment = doc.attachments?.sort(
        (a: any, b: any) => b.version - a.version,
      )[0];
      if (!latestAttachment) throw new AppError("No attachments found", 404);

      return res.status(200).json({
        status: "success",
        data: {
          fileUrl: latestAttachment.fileUrl,
          version: latestAttachment.version,
        },
      });
    },
  );
}

export default new DocumentController();
