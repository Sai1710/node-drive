import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../config/aws.configuration";

class FileController {
  getAllFiles = asyncHandler(async (req: Request, res: Response) => {});
  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    const { file_name, content_type } = req.body;

    const putCommand = new PutObjectCommand({
      Bucket: "drive-699457479069-ap-south-1-an",
      Key: file_name,
      ContentType: content_type,
    });
    const url = await getSignedUrl(s3Client, putCommand, { expiresIn: 3600 });
    console.log(url);
  });
  getFile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
  });
}

export default new FileController();
