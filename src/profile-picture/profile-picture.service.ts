import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UploadedFile,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { Response } from 'express';
import { profilePictures, users } from 'src/db';
import { DrizzleProvider } from 'src/drizzle/drizzle.provider';
import { MinioService } from 'src/minio/minio.service';

@Injectable()
export class ProfilePictureService {
  private db = this.drizzleProvider.getDatabase();

  constructor(
    private readonly minioService: MinioService,
    private readonly drizzleProvider: DrizzleProvider,
  ) {}
  private bucketName = 'profile-pictures';

  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    userId: number,
  ) {
    // verify if user exit
    const userProbablyExists = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1); // Limit results to 1 for reasons of efficiency

    if (!userProbablyExists.length) {
      throw new NotFoundException(`Resource not found`);
    }

    await this.minioService.createBucket(this.bucketName);
    const uniqueFileName = this.minioService.getUniqueFileName(
      file.originalname,
    );

    await this.minioService.uploadFile(
      this.bucketName,
      uniqueFileName,
      file.buffer,
      {
        'Content-Type': file.mimetype,
      },
    );

    await this.db.insert(profilePictures).values({
      userId,
      fileName: uniqueFileName,
      bucket: this.bucketName,
      size: file.size,
      format: file.mimetype,
    });

    return {
      message: 'File uploaded successfully 🚀',
      file: {
        fileName: uniqueFileName,
        format: file.mimetype,
        size: file.size,
      },
    };
  }

  // Secure Access
  async getProfilePicture(
    fileName: string,
    userId: number,
    response: Response,
  ) {
    // verify if user exit
    const userProbablyExists = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1); // Limit results to 1 for reasons of efficiency

    if (!userProbablyExists.length) {
      throw new NotFoundException(`Resource not exists`);
    }

    // Retrieve last profile photo
    const file = await this.db
      .select()
      .from(profilePictures)
      .where(eq(profilePictures.userId, userId))
      .orderBy(sql`${profilePictures.createdAt} desc`) // Sort by creation date, descending

      .limit(1);
    if (!file || file.length === 0) {
      throw new BadRequestException('File not found or access denied');
    }
    const fileBuffer = await this.minioService.getFile(
      this.bucketName,
      fileName,
    );
    response.setHeader('Content-Type', file[0].format);
    response.send(fileBuffer);
  }

  // Private access
  async getProfilePicturePublic(fileName: string, response: Response) {
    const file = await this.db
      .select()
      .from(profilePictures)
      .where(eq(profilePictures.fileName, fileName));

    if (!file || file.length === 0) {
      throw new BadRequestException('Resource not found');
    }
    const fileBuffer = await this.minioService.getFile(
      this.bucketName,
      fileName,
    );
    response.setHeader('Content-Type', file[0].format);
    response.send(fileBuffer);
  }
}
