import { Global, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Global()
@Injectable()
export class MinioService {
  constructor(@Inject('MINIO_CLIENT') private readonly minioClient: any) {}

  async uploadFile(
    bucketName: string,
    fileName: string,
    file: Buffer,
    metaData: any,
  ): Promise<void> {
    await this.minioClient.putObject(bucketName, fileName, file, metaData);
  }

  async createBucket(bucketName: string): Promise<void> {
    const exists = await this.minioClient.bucketExists(bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(bucketName, 'us-east-1');
    }
  }

  getUniqueFileName(originalName: string): string {
    const extension = originalName.split('.').pop();
    return `${randomUUID()}.${extension}`;
  }

  async getFile(bucketName: string, fileName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.minioClient.getObject(
        bucketName,
        fileName,
        (err: any, stream: any) => {
          if (err) return reject(err);
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: any) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        },
      );
    });
  }
}
