
# Gestion des fichiers avec MinIO et routes réécrites

## **1. Installation des dépendances**

```bash
npm install minio @nestjs/platform-express multer class-validator class-transformer
```

---

## **2. Modèle et base de données**

### **Modèle `profilePictures`**

Mise à jour du modèle pour inclure toutes les informations nécessaires :

```typescript
import { integer, serial, text, timestamp, pgTable } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const profilePictures = pgTable('profile_pictures', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(), // Nom unique du fichier
  bucket: text('bucket').notNull(), // Nom du bucket MinIO
  size: integer('size').notNull(), // Taille du fichier
  format: text('format').notNull(), // Format MIME du fichier
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### **Explications des champs**
- **`fileName`** : Nom unique du fichier (ex. : UUID + extension).
- **`bucket`** : Nom du bucket.
- **`size`** : Taille en octets.
- **`format`** : Type MIME du fichier (ex. : `image/jpeg`).

---

## **3. Module MinIO**

### **3.1. Création du fichier `minio.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioService } from './minio.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'MINIO_CLIENT',
      useFactory: (configService: ConfigService) => {
        const Minio = require('minio');
        return new Minio.Client({
          endPoint: configService.get<string>('MINIO_ENDPOINT'),
          port: parseInt(configService.get<string>('MINIO_PORT'), 10),
          useSSL: configService.get<string>('MINIO_USE_SSL') === 'true',
          accessKey: configService.get<string>('MINIO_ACCESS_KEY'),
          secretKey: configService.get<string>('MINIO_SECRET_KEY'),
        });
      },
      inject: [ConfigService],
    },
    MinioService,
  ],
  exports: [MinioService],
})
export class MinioModule {}
```

---

## **4. Service MinIO**

### **4.1. Création du fichier `minio.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class MinioService {
  constructor(@Inject('MINIO_CLIENT') private readonly minioClient: any) {}

  async uploadFile(bucketName: string, fileName: string, file: Buffer, metaData: any): Promise<void> {
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
      this.minioClient.getObject(bucketName, fileName, (err, stream) => {
        if (err) return reject(err);
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    });
  }
}
```

---

## **5. Contrôleur pour gérer les fichiers**

### **5.1. Création du fichier `file.controller.ts`**

```typescript
import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from './minio.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { db } from '../db/db';
import { profilePictures } from '../db/schemas/profile-pictures.schema';

@Controller('files')
export class FileController {
  constructor(private readonly minioService: MinioService) {}

  private bucketName = 'profile-pictures';

  // Upload de fichiers
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 }, // Limite de 2 Mo
      fileFilter: (req, file, callback) => {
        if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
          return callback(new BadRequestException('Format non supporté'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const userId = req.user.id;
    const uniqueFileName = this.minioService.getUniqueFileName(file.originalname);

    await this.minioService.createBucket(this.bucketName);
    await this.minioService.uploadFile(this.bucketName, uniqueFileName, file.buffer, {
      'Content-Type': file.mimetype,
    });

    await db.insert(profilePictures).values({
      userId,
      fileName: uniqueFileName,
      bucket: this.bucketName,
      size: file.size,
      format: file.mimetype,
    });

    return { message: 'Fichier uploadé avec succès' };
  }

  // Accès sécurisé
  @UseGuards(JwtAuthGuard)
  @Get('secure/:fileName')
  async getSecureFile(
    @Param('fileName') fileName: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    const file = await db
      .select()
      .from(profilePictures)
      .where(profilePictures.fileName.eq(fileName))
      .and(profilePictures.userId.eq(userId))
      .execute();

    if (!file || file.length === 0) {
      throw new BadRequestException('Fichier introuvable ou accès refusé');
    }

    const fileBuffer = await this.minioService.getFile(this.bucketName, fileName);
    res.setHeader('Content-Type', file[0].format);
    res.send(fileBuffer);
  }

  // Accès public
  @Get('public/:fileName')
  async getPublicFile(@Param('fileName') fileName: string, @Res() res: Response) {
    const file = await db
      .select()
      .from(profilePictures)
      .where(profilePictures.fileName.eq(fileName))
      .execute();

    if (!file || file.length === 0) {
      throw new BadRequestException('Fichier introuvable');
    }

    const fileBuffer = await this.minioService.getFile(this.bucketName, fileName);
    res.setHeader('Content-Type', file[0].format);
    res.send(fileBuffer);
  }
}
```

---

## **6. Résumé des routes**

1. **Upload sécurisé**
   - Endpoint : `POST /files/upload`
   - Protégé par JWT (`JwtAuthGuard`).

2. **Accès sécurisé**
   - Endpoint : `GET /files/secure/:fileName`
   - Protégé par JWT.

3. **Accès public**
   - Endpoint : `GET /files/public/:fileName`
   - Accessible à tous sans limite de temps.

---

Avec cette solution, les fichiers passent exclusivement par **NestJS** et sont accessibles via `localhost:3000`. MinIO n'est jamais exposé directement. 😊
