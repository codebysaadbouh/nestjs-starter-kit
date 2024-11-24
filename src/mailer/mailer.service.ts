import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as hbs from 'nodemailer-express-handlebars';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

/**
 * Requirements :
 * npm install nodemailer nodemailer-express-handlebars handlebars hbs
 * npm install -D @types/nodemailer-express-handlebars @types/passport-jwt
 */
@Injectable()
export class MailerService {
  private transporter: any;

  constructor(configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get('SMTP_HOST'), // Replace with your SMTP server
      port: configService.get('SMTP_PORT'),
      ignoreTLS: true,
      auth: {
        user: configService.get('SMTP_USER'),
        pass: configService.get('SMTP_PASS'),
      },
    });

    // Register the partials using Handlebars
    const partialsDir = path.resolve(__dirname, '../../src/emails/partials');
    const partials = fs.readdirSync(partialsDir);
    partials.forEach((file) => {
      const partialName = path.basename(file, '.hbs');
      const partialTemplate = fs.readFileSync(
        path.join(partialsDir, file),
        'utf8',
      );
      Handlebars.registerPartial(partialName, partialTemplate);
    });

    // Configure the Handlebars template engine
    this.transporter.use(
      'compile',
      hbs({
        viewEngine: {
          extname: '.hbs',
          layoutsDir: path.resolve(__dirname, '../../src/emails'),
          defaultLayout: false,
        },
        viewPath: path.resolve(__dirname, '../../src/emails'),
        extName: '.hbs',
      }),
    );
  }

  async sendMail(to: string, subject: string, template: string, context: any) {
    const mailOptions = {
      from: '"Support" <contact@nk.com>',
      to,
      subject,
      template, // Name of template file without extension
      context, // Data to be injected into the template
    };

    return this.transporter.sendMail(mailOptions);
  }

  async renderTemplate(templateName: string, context: any): Promise<string> {
    // Chemin vers le répertoire des partials
    const partialsDir = path.join(__dirname, '..', 'emails', 'partials');
    const partialFiles = fs.readdirSync(partialsDir);

    partialFiles.forEach((file) => {
      const partialPath = path.join(partialsDir, file);
      const partialName = path.basename(file, '.hbs');
      const partialTemplate = fs.readFileSync(partialPath, 'utf-8');
      Handlebars.registerPartial(partialName, partialTemplate);
    });

    // Chemin vers le template principal
    const templatePath = path.join(
      __dirname,
      '..',
      'emails',
      `${templateName}.hbs`,
    );
    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(template);

    return compiledTemplate(context);
  }
}
