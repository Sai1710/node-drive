import { Request, Response } from "express";
import {
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
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
import FileService from "./file.service";

class FileController {
  static initializeUpload = asyncHandler(
    async (req: Request, res: Response) => {
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
        await fileModel.findByIdAndUpdate(createdFile._id, {
          upload_id: uploadUrls.upload_id,
        });
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
    }
  );

  static completeUpload = asyncHandler(async (req: Request, res: Response) => {
    const { file_id } = req.params;
    const { parts, upload_id: bodyUploadId } = req.body;

    if (!Array.isArray(parts) || parts.length === 0) {
      throw new ApiError(400, "Invalid request");
    }

    const fileObj = await fileModel.findById(file_id);
    if (!fileObj?._id) {
      throw new ApiError(404, "No file found");
    }

    const uploadId =
      (fileObj as { upload_id?: string }).upload_id ?? bodyUploadId;
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

    await s3Client.send(completeUploadCommand);

    const updated = await fileModel.findByIdAndUpdate(
      file_id,
      { status: "uploaded", s3_key: fileObj._id.toString() },
      { new: true }
    );

    res.status(200).json(new ApiResponse(200, updated, "Upload complete"));
  });

  static getAllFiles = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const userFiles = await fileModel
      .find({
        user_id: new mongoose.Types.ObjectId(userId),
        is_trashed: false,
      })
      .sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, { files: userFiles }));
  });

  static getFilePreview = asyncHandler(async (req: Request, res: Response) => {
    const s3Key = req.params?.id.toString();
    const getCommand = new GetObjectCommand({
      Bucket: AWS_BUCKET,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, getCommand);
    res.status(200).json(new ApiResponse(200, { presigned_url: url }));
  });

  static getFileData = asyncHandler(async (req: Request, res: Response) => {
    const fileId = req.params?.id.toString();
    const fileData = await fileModel.findById(fileId);
    if (!fileData?._id) {
      throw new ApiError(404, "No file found");
    }
    res.status(200).json(new ApiResponse(200, fileData, "File data fetched"));
  });
}

export default FileController;
