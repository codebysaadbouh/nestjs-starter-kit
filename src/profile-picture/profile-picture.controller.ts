import {
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BadRequestException, Controller, UploadedFile } from '@nestjs/common';
import { ProfilePictureService } from './profile-picture.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/authentication/guards/jwt.guard';
import { Request, Response } from 'express';

@Controller('profile-picture')
export class ProfilePictureController {
  constructor(private readonly profilePictureService: ProfilePictureService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mb limit
      fileFilter: (req, file, callback) => {
        if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
          return callback(new BadRequestException('Unsupported format'), false);
        }
        callback(null, true);
      },
    }),
  )
  uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ) {
    const idUser = request.user['id'];
    return this.profilePictureService.uploadProfilePicture(file, idUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get('secure/:fileName')
  getProfilePicture(
    @Param('fileName') fileName: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const idUser = request.user['id'];
    return this.profilePictureService.getProfilePicture(
      fileName,
      idUser,
      response,
    );
  }

  @Get('public/:fileName')
  getProfilePicturePublic(
    @Param('fileName') fileName: string,
    @Res() response: Response,
  ) {
    return this.profilePictureService.getProfilePicturePublic(
      fileName,
      response,
    );
  }
}
