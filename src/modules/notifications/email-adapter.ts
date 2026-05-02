import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailAdapter {
  private transporter: nodemailer.Transporter;
  private readonly smtpFromUser: string;

  constructor(private readonly configService: ConfigService) {
    const smtpUser =
      this.configService.get<string>('SMTP_USER')?.trim() ||
      'd.ilyasovunibell@gmail.com';
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
    const smtpHost = this.configService.get<string>('SMTP_HOST')?.trim();
    const smtpPort = this.configService.get<string>('SMTP_PORT');
    const smtpService =
      this.configService.get<string>('SMTP_SERVICE')?.trim() || 'gmail';

    this.smtpFromUser = smtpUser;

    this.transporter = nodemailer.createTransport(
      smtpHost
        ? {
            host: smtpHost,
            port: smtpPort ? Number(smtpPort) : 587,
            auth: {
              user: smtpUser,
              pass: smtpPassword,
            },
          }
        : {
            service: smtpService,
            auth: {
              user: smtpUser,
              pass: smtpPassword,
            },
          },
    );
  }

  async sendConfirmationCodeEmail(
    email: string,
    code: string,
  ) /*: Promise<void>*/ {
    await this.transporter.sendMail({
      from: `"Confirm email" <${this.smtpFromUser}>`,
      to: email,
      subject: 'Confirmation Code',
      html: `<h1>Thank for your registration</h1>
            <p>To finish registration please follow the link below:
                <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a>
            </p>`,
    });
  }

  async sendRecoveryCodeEmail(email: string, code: string) /*: Promise<void>*/ {
    await this.transporter.sendMail({
      from: `"Recovery code" <${this.smtpFromUser}>`,
      to: email,
      subject: 'Password Recovery',
      html: `<h1>Password recovery</h1>
            <p>To finish password recovery please follow the link below:
                <a href='https://somesite.com/password-recovery?recoveryCode=${code}'>recovery password</a>
            </p>`,
    });
  }
}
