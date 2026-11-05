import mongoose from "mongoose";

import { TFile, TFileModel } from "../../types/file.types";
import {
  FILE_TYPE,
  FILE_TYPES,
  UPLOAD_STATUS,
  UPLOAD_STATUSES,
} from "../../constants/file.constants";
import {
  FILE_MODEL_NAME,
  USER_MODEL_NAME,
} from "../../constants/model.constants";

const fileSchema = new mongoose.Schema<TFile, TFileModel>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: USER_MODEL_NAME,
      required: true,
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: FILE_MODEL_NAME,
      default: null,
    },
    ancestors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: FILE_MODEL_NAME,
      },
    ],
    file_name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: FILE_TYPES,
      default: FILE_TYPE.FILE,
    },
    mime_type: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      default: 0,
      min: 0,
    },
    s3_key: {
      type: String,
      default: null,
    },
    // S3 multipart upload id, set while an upload is in progress.
    upload_id: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: UPLOAD_STATUSES,
      default: UPLOAD_STATUS.PENDING,
    },
    is_trashed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Listing a folder's contents is the hot query: user + parent folder.
fileSchema.index({ user_id: 1, parent_id: 1, is_trashed: 1 });

export default fileSchema;
