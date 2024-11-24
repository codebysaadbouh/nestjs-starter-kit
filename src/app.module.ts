import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { MailerModule } from './mailer/mailer.module';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { DrizzleProvider } from './drizzle/drizzle.provider';
import { MinioModule } from './minio/minio.module';
import { ProfilePictureManagementController } from './profile-picture-management/profile-picture-management.controller';
import { ProfilePictureController } from './profile-picture/profile-picture.controller';
import { ProfilePictureService } from './profile-picture/profile-picture.service';
import { ProfilePictureModule } from './profile-picture/profile-picture.module';

@Module({
  imports: [
    // Config Module Documentation ->  https://docs.nestjs.com/techniques/configuration
    ConfigModule.forRoot({ isGlobal: true }),
    AuthenticationModule,
    MailerModule,
    DrizzleModule,
    MinioModule,
    ProfilePictureModule,
  ],
  providers: [DrizzleProvider, ProfilePictureService],
  controllers: [ProfilePictureManagementController, ProfilePictureController],
})
export class AppModule {}
