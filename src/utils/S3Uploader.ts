import AWS from "aws-sdk";
import { AppError } from "./AppError";

const accessKeyId = process.env.ACCESS_KEY || "";
const secretAccessKey = process.env.SECRET_ACCESS_KEY || "";
const bucketRegion = process.env.BUCKET_REGION || "";
const bucketName = process.env.BUCKET_NAME || "";

const s3 = new AWS.S3({
  accessKeyId,
  secretAccessKey,
  region: bucketRegion,
});

export async function uploadFile(file: Express.Multer.File) {
  if (!file) throw new AppError("No file uploaded", 400);

  const params = {
    Bucket: bucketName,
    Key: file.originalname + "-" + Date.now(),
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };
  const uploadResult = await s3.upload(params).promise();

  return uploadResult.Location;
}

export async function deleteFile(fileUrl: string) {
  try {
    const urlObj = new URL(fileUrl);
    const key = decodeURIComponent(urlObj.pathname.substring(1));

    const deleteParams = {
      Bucket: bucketName,
      Key: key || "",
    };

    await s3.deleteObject(deleteParams).promise();
  } catch (e: any) {
    throw new AppError(e.message, 500);
  }
}
