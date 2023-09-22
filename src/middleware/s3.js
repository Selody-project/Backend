const {
  S3Client, PutObjectCommand, DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const mime = require('mime');
const transliterate = require('transliterate');
const {
  ApiError, FileTooLargeError,
} = require('../errors');

function sanitizeFileName(fileName) {
  // 파일명에서 특수 문자와 유니코드 문자 제거
  const sanitized = fileName.replace(/[^\w\d.-]/g, '_');
  return sanitized;
}

const s3Config = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
};

const s3Client = new S3Client(s3Config);

function getFilePathFromUrl(fileUrl) {
  const urlParts = fileUrl.split('/');
  const filePath = urlParts.slice(3).join('/');
  return filePath;
}

async function uploadProfileMiddleware(req, res, next) {
  try {
    if (req?.files?.image) {
      const contentLength = req.headers['content-length'];
      const maxFileSize = 1 * 1024 * 1024;

      if (contentLength > maxFileSize) {
        return next(new FileTooLargeError());
      }

      const file = req.files.image;
      const fileName = transliterate(sanitizeFileName(req.files.image.name));
      const bucketName = process.env.AWS_BUCKET_NAME;
      const folderName = process.env.AWS_PROFILE_FOLDER;
      const contentType = mime.getType(fileName);
      const bucketParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${folderName}/${Date.now()}_${fileName}`,
        Body: file.data,
        ContentType: contentType,
      };

      const command = new PutObjectCommand(bucketParams);
      await s3Client.send(command);
      const fileUrl = `https://${bucketName}.s3.amazonaws.com/${bucketParams.Key}`;
      req.fileUrl = fileUrl;
    } else {
      req.fileUrl = null;
    }
    next();
  } catch (err) {
    return next(new ApiError());
  }
}

async function uploadPostMiddleware(req, res, next) {
  try {
    if (req?.files?.image) {
      const contentLength = req.headers['content-length'];
      const maxFileSize = 3 * 1024 * 1024;

      if (contentLength > maxFileSize) {
        return next(new FileTooLargeError());
      }

      const file = req.files.image;
      const fileName = transliterate(sanitizeFileName(req.files.image.name));
      const bucketName = process.env.AWS_BUCKET_NAME;
      const folderName = process.env.AWS_POST_FOLDER;
      const contentType = mime.getType(fileName);
      const bucketParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${folderName}/${Date.now()}_${fileName}`,
        Body: file.data,
        ContentType: contentType,
      };

      const command = new PutObjectCommand(bucketParams);
      await s3Client.send(command);
      const fileUrl = `https://${bucketName}.s3.amazonaws.com/${bucketParams.Key}`;
      req.fileUrl = fileUrl;
    } else {
      req.fileUrl = null;
    }
    next();
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteBucketImage(fileUrl) {
  try {
    if (fileUrl !== null || fileUrl === process.env.DEFAULT_USER_IMAGE) {
      const bucketName = process.env.AWS_BUCKET_NAME;
      const fileKey = getFilePathFromUrl(fileUrl);
      const deleteParams = {
        Bucket: bucketName,
        Key: fileKey,
      };
      const deleteCommand = new DeleteObjectCommand(deleteParams);
      await s3Client.send(deleteCommand);
    }

    return true;
  } catch (err) {
    return new ApiError();
  }
}

module.exports = {
  uploadProfileMiddleware,
  uploadPostMiddleware,
  deleteBucketImage,
};
