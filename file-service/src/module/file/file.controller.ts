import { Request, Response } from "express";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../config/aws.configuration";
import { AWS_BUCKET } from "../../config/env.configuration";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  fileModel,
} from "@sakiriti/drive-common";
import mongoose from "mongoose";

class FileController {
  getAllFiles = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const userFiles = await fileModel
      .find({
        user_id: new mongoose.Types.ObjectId(userId),
        is_trashed: false,
      })
      .sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, { files: userFiles }));
  });

  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    const { file_name, content_type, size } = req.body;
    const user_id = req.user?._id;

    if (!file_name || !content_type) {
      throw new ApiError(400, "file name and content type is required");
    }
    const createdFile = await fileModel.create({
      file_name,
      user_id,
      size,
      mime_type: content_type,
    });

    const putCommand = new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: createdFile._id.toString(),
      ContentType: content_type,
    });
    const url = await getSignedUrl(s3Client, putCommand, { expiresIn: 3600 });

    res.status(200).json(new ApiResponse(200, { presigned_url: url }));
  });

  getFilePreview = asyncHandler(async (req: Request, res: Response) => {
    const s3Key = req.params?.id.toString();
    const getCommand = new GetObjectCommand({
      Bucket: AWS_BUCKET,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, getCommand);
    res.status(200).json(new ApiResponse(200, { presigned_url: url }));
  });

  getFileData = asyncHandler(async (req: Request, res: Response) => {
    const fileId = req.params?.id.toString();
    const fileData = await fileModel.findById(fileId);
    if (!fileData?._id) {
      throw new ApiError(404, "No file found");
    }
    res.status(200).json(new ApiResponse(200, fileData, "File data fetched"));
  });
}

export default new FileController();
