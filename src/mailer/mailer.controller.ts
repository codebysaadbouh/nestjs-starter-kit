import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';

@Controller('mailer')
export class MailerController {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService : ConfigService
  ) {}

  @Get(':templateName')
  async previewEmail(
    @Param('templateName') templateName: string,
  ): Promise<string> {
    if (
      this.configService.get('NODE_ENV') === 'production' &&
      this.configService.get('DISABLE_MAIL_PREVIEW') === 'true'
    ) {
      throw new HttpException(
        'Mail preview is disabled in development mode 🏴‍☠️',
        HttpStatus.FORBIDDEN,
      );
    }
    const context = {}; // Fill in the data required for rendering
    return this.mailerService.renderTemplate(templateName, context);
  }
}