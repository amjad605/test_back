import { AppError } from "../utils/AppError";
import { deleteFile } from "../utils/S3Uploader";
import { Document } from "./document.model";
import { Company } from "../companies/company.model";
import auditService from "../audit/audit.service";

class DocumentService {
  prepareDocumentData(data: any) {
    if (data.estimatedFee && typeof data.estimatedFee !== "object") {
      const amount = Number(data.estimatedFee);
      data.estimatedFee = {
        amount,
        currency: "KWD",
      };
    }

    if (typeof data.isInternalOnly === "string") {
      data.isInternalOnly = data.isInternalOnly === "true";
    }

    // Robustly handle customFields parsing from FormData
    let customFields = data.customFields;
    if (typeof customFields === "string") {
      try {
        customFields = JSON.parse(customFields);
      } catch (e) {
        customFields = [];
      }
    } else if (
      Array.isArray(customFields) &&
      customFields.length === 1 &&
      typeof customFields[0] === "string"
    ) {
      try {
        customFields = JSON.parse(customFields[0]);
      } catch (e) {
        customFields = [];
      }
    }
    data.customFields = customFields;

    return data;
  }

  async getDocuments(query: any, user: any) {
    const {
      page = 1,
      limit = 10,
      search,
      ownerType,
      ownerId,
      status,
      isInternalOnly,
      sort = "-createdAt",
    } = query;

    const filter: any = {};

    // For clients, they can only see documents they own or their company owns, and are not internal
    if (user.role === "Client") {
      const allowedOwnerIds = [user.id];
      if (user.companyId) allowedOwnerIds.push(user.companyId);

      filter.ownerId = { $in: allowedOwnerIds };
      filter.isInternalOnly = false;
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    if (ownerType) filter.ownerType = ownerType;
    if (ownerId) filter.ownerId = ownerId;
    if (status) filter.status = status;
    if (isInternalOnly !== undefined)
      filter.isInternalOnly = isInternalOnly === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [documents, total] = await Promise.all([
      Document.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Document.countDocuments(filter),
    ]);

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const docsWithExpiry = documents.map((doc: any) => {
      const docObj = doc.toObject();
      if (
        doc.expiryDate &&
        doc.expiryDate <= thirtyDaysFromNow &&
        doc.expiryDate >= today
      ) {
        docObj.expiresSoon = true;
      } else {
        docObj.expiresSoon = false;
      }
      return docObj;
    });

    return {
      documents: docsWithExpiry,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getDocumentById(id: string, user: any) {
    const doc = await Document.findById(id);
    if (!doc) throw new AppError("Document not found", 404);

    if (user.role === "Client") {
      const isOwner = doc.ownerId.toString() === user.id.toString();
      const isCompanyDoc =
        user.companyId && doc.ownerId.toString() === user.companyId.toString();

      if ((!isOwner && !isCompanyDoc) || doc.isInternalOnly) {
        throw new AppError("Forbidden", 403);
      }
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const docObj = doc.toObject() as any;
    docObj.expiresSoon = !!(
      doc.expiryDate &&
      doc.expiryDate <= thirtyDaysFromNow &&
      doc.expiryDate >= today
    );

    return docObj;
  }

  async getDocumentsByCompanyId(id: string, query: any) {
    const { page = 1, limit = 10, visibility, status } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { ownerId: id };
    if (visibility) {
      filter.isInternalOnly = visibility === "internal";
    }
    if (status) {
      filter.status = status;
    }

    const [total, docs] = await Promise.all([
      Document.countDocuments(filter),
      Document.find(filter).skip(skip).limit(Number(limit)),
    ]);

    return {
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
      documents: docs,
    };
  }

  async createDocument(data: any, user: any) {
    // Role Check for Client
    if (user?.role === "Client") {
      if (!user.companyId) throw new AppError("Access denied", 403);
      const company = await Company.findById(user.companyId);
      if (!company) throw new AppError("Company not found", 404);

      const isMissing = company.missingDocsChecklist.some(
        (item) => item.docType === data.docType,
      );
      if (!isMissing) {
        throw new AppError(
          "This document type is not in your missing checklist",
          403,
        );
      }

      // Ensure client is uploading for their own company
      data.ownerType = "Company";
      data.ownerId = user.companyId;
    }

    const document = await Document.create(data);

    // Audit: Log create action
    await auditService.logCreate(
      user.id,
      "Document",
      document,
      document.ownerId,
    );

    return document;
  }

  async updateDocument(id: string, data: any, userId: string) {
    // Get old data for audit diff
    const oldDoc = await Document.findById(id).lean();
    if (!oldDoc) throw new AppError("Document not found", 404);

    const doc = await Document.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw new AppError("Document not found", 404);

    // Audit: Log update action
    await auditService.logUpdate(
      userId,
      "Document",
      id,
      oldDoc,
      doc.toObject(),
      doc.ownerId,
    );

    return doc;
  }

  async addAttachment(id: string, fileUrl: string) {
    const doc = await Document.findById(id);
    if (!doc) throw new AppError("Document not found", 404);

    const lastVersion = doc.attachments.reduce(
      (max, att) => Math.max(max, att.version || 0),
      0,
    );

    doc.attachments.push({
      fileUrl,
      version: lastVersion + 1,
      uploadedAt: new Date(),
    });

    await doc.save();
    return doc;
  }

  async deleteDocument(id: string, userId: string) {
    const doc = await Document.findById(id);
    if (!doc) throw new AppError("Document not found", 404);
    const docData = doc.toObject();

    // Delete all attachments from S3
    for (const att of doc.attachments) {
      if (att.fileUrl) {
        try {
          await deleteFile(att.fileUrl);
        } catch (error) {
          console.error(`Failed to delete file from S3: ${att.fileUrl}`, error);
        }
      }
    }

    await Document.findByIdAndDelete(id);

    // Audit: Log delete action
    await auditService.logDelete(userId, "Document", docData);
  }
}

export default new DocumentService();
