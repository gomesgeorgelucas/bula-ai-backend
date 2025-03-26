import { s3Config } from '@/config/object-storage';
import {
  _Object,
  Bucket,
  CreateBucketCommand,
  CreateBucketCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  HeadObjectCommand,
  ListBucketsCommand,
  ListBucketsCommandOutput,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name);

  constructor() {}

  async bucketExists(Bucket: string): Promise<boolean> {
    const availableBuckets: Bucket[] = await this.listBuckets();

    return Boolean(
      availableBuckets.find((bucket: Bucket) => bucket.Name === Bucket),
    );
  }

  async createBucket(Bucket: string): Promise<CreateBucketCommandOutput> {
    try {
      const createBucketCommand: CreateBucketCommand = new CreateBucketCommand({
        Bucket,
      });

      const createOutput: CreateBucketCommandOutput =
        await s3Config.send(createBucketCommand);

      return createOutput;
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }

      this.logger.error(
        `Error creating bucket: ${Bucket}`,
        (e as Error)?.stack,
      );

      throw new InternalServerErrorException(
        'Failed to create bucket',
        (e as Error)?.stack,
      );
    }
  }

  async listBuckets(): Promise<Bucket[]> {
    const getBuckets: ListBucketsCommand = new ListBucketsCommand({});
    const { Buckets }: ListBucketsCommandOutput =
      await s3Config.send(getBuckets);

    return Buckets;
  }

  async listObjects(Bucket: string): Promise<_Object[]> {
    const getObjectsCommand = new ListObjectsV2Command({
      Bucket,
    });

    try {
      const { Contents } = await s3Config.send(getObjectsCommand);

      if (!Contents || !Contents.length) {
        return [];
      }

      return Contents;
    } catch (e) {
      this.logger.error(
        `Error listing objects in bucket: ${(e as Error).message}`,
        (e as Error)?.stack,
      );

      throw new NotFoundException('Bucket not found', (e as Error).message);
    }
  }

  async listHeaders(
    bucketName: string,
    objectName: string,
  ): Promise<Record<string, string>> {
    const getHeadersCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectName,
    });

    try {
      const { Metadata } = await s3Config.send(getHeadersCommand);

      return Metadata;
    } catch (e) {
      this.logger.error(
        `Error getting object headers: ${(e as Error).message}`,
        (e as Error)?.stack,
      );

      throw new NotFoundException('Object not found', (e as Error).message);
    }
  }

  async uploadObject(
    file: Express.Multer.File,
    Bucket: string,
    Metadata?: any,
  ): Promise<PutObjectCommandOutput> {
    if (!(await this.bucketExists(Bucket))) {
      this.logger.log('Bucket does not exist, creating it...');
      await this.createBucket(Bucket);
    }

    const putObjectCommand: PutObjectCommand = new PutObjectCommand({
      Bucket,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
      Metadata,
    });

    try {
      const putObjectReturn: PutObjectCommandOutput =
        await s3Config.send(putObjectCommand);

      return putObjectReturn;
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }

      this.logger.error(
        `Error uploading file to S3: ${(e as Error).message}`,
        (e as Error)?.stack,
      );

      throw new InternalServerErrorException(
        `Failed to upload file: ${e.message}`,
        (e as Error)?.stack,
      );
    }
  }

  async deleteObject(
    Key: string,
    Bucket: string,
  ): Promise<DeleteObjectCommandOutput> {
    const removeObjectCommand: DeleteObjectCommand = new DeleteObjectCommand({
      Bucket,
      Key,
    });

    const deleteCommand: DeleteObjectCommandOutput =
      await s3Config.send(removeObjectCommand);

    return deleteCommand;
  }
}
