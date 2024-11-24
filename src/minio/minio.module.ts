import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioService } from './minio.service';
import * as Minio from 'minio';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'MINIO_CLIENT',
      useFactory: (configService: ConfigService) => {
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