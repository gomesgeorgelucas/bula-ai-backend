import { S3Client } from '@aws-sdk/client-s3';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as path from 'path';

const useMinio: boolean = process.env.USE_MINIO === 'true';

export const MAX_FILE_SIZE = 1024 * 1024 * 50;

export const MAX_FILE_COUNT = 20;

export const awsConfig = {
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  region: process.env.S3_REGION,
  retryMode: 'standard',
  maxAttempts: 3,
  ...(useMinio && {
    endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY_ID,
      secretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY,
    },
  }),
};

export const s3Config = new S3Client(awsConfig);

export const multerOptionsKey = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: any, key?: string) => void,
): void => {
  callback(
    null,
    `${path.parse(file.originalname).name}${path.parse(file.originalname).ext}`,
  );
};

const multerConfig: MulterOptions = {
  limits: {
    files: MAX_FILE_COUNT,
    fileSize: MAX_FILE_SIZE,
  },
};

export default multerConfig;
