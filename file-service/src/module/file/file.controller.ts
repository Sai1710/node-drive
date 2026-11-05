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
  TFile,
  TFileDocument,
  userModel,
} from "@sakiriti/drive-common";
import mongoose, { QueryFilter } from "mongoose";
import FileService from "./file.service";

class FileController {
  s3Client: S3Client;

  constructor() {
    this.s3Client = awsClient.s3Client;
  }

  initializeUpload = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { file_name, mime_type, size, parent_id } = req.body;

    if (!file_name || !size || !mime_type) {
      throw new ApiError(400, "Invalid request");
    }

    const mbSize = size / 1_000_000;
    const isMultiPartUpload = mbSize > 10;

    let parentFolder;
    if (parent_id) {
      parentFolder = await fileModel.findOne({
        _id: parent_id,
        type: "folder",
        user_id: userId,
        is_trashed: false,
      });

      if (!parentFolder?._id) {
        throw new ApiError(404, "No folder found");
      }
    }

    const createdFile = await fileModel.create({
      file_name,
      user_id: userId,
      size,
      mime_type,
      parent_id,
      ancestors: parentFolder?._id
        ? parentFolder?.ancestors?.concat(parent_id)
        : null,
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

    const { folder_id } = req.query;

    const queryFilter: QueryFilter<TFile> = folder_id
      ? {
          user_id: userId,
          is_trashed: false,
          parent_id: folder_id,
        }
      : { user_id: userId, is_trashed: false };

    const userFiles = await fileModel.find(queryFilter).sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, { files: userFiles }));
  });

  createFolder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { folder_name, parent_id } = req.body;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!folder_name) {
      throw new ApiError(403, "Folder name is required");
    }

    const doesUserExist = await userModel.exists({ _id: userId });

    if (!doesUserExist) {
      throw new ApiError(403, "User doesn't exist");
    }
    let parentFolder;

    if (parent_id) {
      parentFolder = await fileModel.findOne({
        _id: parent_id,
        type: "folder",
        user_id: userId,
        is_trashed: false,
      });

      if (!parentFolder?._id) {
        throw new ApiError(404, "Folder doesnt exist");
      }
    }
    await fileModel.create({
      user_id: userId,
      type: "folder",
      file_name: folder_name,
      parent_id,
      ancestors: parentFolder?._id
        ? parentFolder.ancestors?.concat(parentFolder._id)
        : [],
    });

    res.status(201).json(new ApiResponse(201, {}, "Folder created"));
  });

  getFilePreview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const fileId = req.params.id;

    const dbFile = await fileModel.findOne({
      _id: fileId,
      user_id: userId,
    });

    if (!dbFile?._id || !dbFile.s3_key || dbFile.status !== "uploaded") {
      throw new ApiError(404, "File doesnt exisy");
    }

    const s3Key = dbFile.s3_key?.toString();
    const getCommand = new GetObjectCommand({
      Bucket: AWS_BUCKET,
      Key: s3Key,
    });

    const url = await getSignedUrl(this.s3Client, getCommand);
    res.status(200).json(new ApiResponse(200, { presigned_url: url }));
  });

  getFileData = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const fileId = req.params.id;

    const dbFile = await fileModel.findOne({
      _id: fileId,
      user_id: userId,
    });

    if (!dbFile?._id || !dbFile.s3_key || dbFile.status !== "uploaded") {
      throw new ApiError(404, "File doesnt exisy");
    }

    res.status(200).json(new ApiResponse(200, dbFile, "File data fetched"));
  });

  renameFile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const fileId = req.params.id;
    const { file_name } = req.body;

    const dbFile = await fileModel.findOne({
      _id: fileId,
      user_id: userId,
    });

    if (!dbFile?._id || !dbFile.s3_key || dbFile.status !== "uploaded") {
      throw new ApiError(404, "File doesnt exisy");
    }

    dbFile.file_name = file_name;
    await dbFile.save();

    res.status(200).json(new ApiResponse(200, {}, "Filename updated"));
  });

  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const fileId = req.params.id;

    const dbFile = await fileModel.findOne({
      _id: fileId,
      user_id: userId,
    });

    if (!dbFile?._id || !dbFile.s3_key || dbFile.status !== "uploaded") {
      throw new ApiError(404, "File doesnt exisy");
    }

    dbFile.is_trashed = true;
    await dbFile.save();

    res.status(200).json(new ApiResponse(200, {}, "File deleted successfully"));
  });
}

export default new FileController();
