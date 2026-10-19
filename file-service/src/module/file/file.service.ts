import {
  CreateMultipartUploadCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { TFileDocument } from "@sakiriti/drive-common";
import { AWS_BUCKET } from "../../config/env.configuration";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../config/aws.configuration";

class FileService {
  static async generateSinglePartUploadData(fileReq: TFileDocument) {
    const putCommand = new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: fileReq._id.toString(),
      ContentType: fileReq.mime_type,
    });

    const preSignedUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 3600,
    });

    return { upload_id: null, upload_urls: [preSignedUrl] };
  }

  static async generateMultiPartUploadData(fileReq: TFileDocument) {
    const createMultipartCommand = new CreateMultipartUploadCommand({
      Bucket: AWS_BUCKET,
      Key: fileReq._id.toString(),
      ContentType: fileReq.mime_type,
    });

    const mbSize = fileReq.size / 100_00_00;
    const noOfParts = Math.ceil(mbSize / 10) ;

    const startUploadResponse = await s3Client.send(createMultipartCommand);
    let preSignedUrls = [];

    for (let i = 0; i < noOfParts; i++) {
      const url = await getSignedUrl(
        s3Client,
        new UploadPartCommand({
          Bucket: AWS_BUCKET,
          Key: fileReq._id.toString(),
          UploadId: startUploadResponse.UploadId,
          PartNumber: i + 1,
        }),
        { expiresIn: 3600 }
      );
      preSignedUrls.push(url);
    }

    return {
      upload_id: startUploadResponse.UploadId,
      upload_urls: preSignedUrls,
    };
  }

  static buildInitializeUploadResponse() {}
}
export default FileService;
