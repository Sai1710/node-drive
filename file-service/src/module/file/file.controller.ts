import { Request, Response } from "express";
import {
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import awsClient from "../../config/aws.configuration";
import { AWS_BUCKET } from "../../config/env.configuration";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  fileModel,
} from "@sakiriti/drive-common";
import mongoose from "mongoose";
import FileService from "./file.service";

class FileController {
  s3Client: S3Client;

  constructor() {
    this.s3Client = awsClient.s3Client;
  }

  initializeUpload = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { file_name, mime_type, size } = req.body;

    if (!file_name || !size || !mime_type) {
      throw new ApiError(400, "Invalid request");
    }

    const mbSize = size / 1_000_000;
    const isMultiPartUpload = mbSize > 10;

    const createdFile = await fileModel.create({
      file_name,
      user_id: userId,
      size,
      mime_type,
    });

    const uploadUrls = isMultiPartUpload
      ? await FileService.generateMultiPartUploadData(createdFile)
      : await FileService.generateSinglePartUploadData(createdFile);

    if (uploadUrls.upload_id) {
      createdFile.upload_id = uploadUrls.upload_id;
      await createdFile.save();
    }

    const fileResponse = {
      file_id: createdFile._id.toString(),
      upload_urls: uploadUrls.upload_urls,
      upload_type: isMultiPartUpload ? "MULTI" : "SINGLE",
      upload_id: uploadUrls.upload_id,
    };
    res
      .status(200)
      .json(new ApiResponse(200, fileResponse, "Initialized upload"));
  });

  completeUpload = asyncHandler(async (req: Request, res: Response) => {
    const { file_id } = req.params;
    const { parts } = req.body;

    if (!Array.isArray(parts) || parts.length === 0) {
      throw new ApiError(400, "Invalid request");
    }

    const fileObj = await fileModel.findById(file_id);
    if (!fileObj?._id) {
      throw new ApiError(404, "No file found");
    }

    const uploadId = fileObj.upload_id;
    if (!uploadId) {
      throw new ApiError(400, "Missing upload id");
    }

    const completeUploadCommand = new CompleteMultipartUploadCommand({
      Bucket: AWS_BUCKET,
      Key: fileObj._id.toString(),
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .map((part: { part_number: number; etag: string }) => ({
            PartNumber: part.part_number,
            ETag: part.etag,
          }))
          .sort(
            (a: { PartNumber: number }, b: { PartNumber: number }) =>
              a.PartNumber - b.PartNumber
          ),
      },
    });

    await this.s3Client.send(completeUploadCommand);

    const updated = await fileModel.findByIdAndUpdate(
      file_id,
      { status: "uploaded", s3_key: fileObj._id.toString() },
      { new: true }
    );

    res.status(200).json(new ApiResponse(200, updated, "Upload complete"));
  });

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

  getFilePreview = asyncHandler(async (req: Request, res: Response) => {
    const s3Key = req.params?.id.toString();
    const getCommand = new GetObjectCommand({
      Bucket: AWS_BUCKET,
      Key: s3Key,
    });

    const url = await getSignedUrl(this.s3Client, getCommand);
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

  renameFile = asyncHandler(async (req: Request, res: Response) => {
    const { file_name } = req.body;
    const { id } = req.params;

    await fileModel.findByIdAndUpdate(id, {
      file_name,
    });

    res.status(200).json(new ApiResponse(200, {}, "Filename updated"));
  });

  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await fileModel.findByIdAndUpdate(id, {
      is_trashed: true,
    });

    res.status(200).json(new ApiResponse(200, {}, "File deleted successfully"));
  });
}

export default new FileController();
