import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport = require('nodemailer/lib/smtp-transport');

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
    const smtpPortRaw = this.configService.get<string>('SMTP_PORT')?.trim();
    const smtpSecureRaw = this.configService
      .get<string>('SMTP_SECURE')
      ?.trim()
      ?.toLowerCase();
    const smtpService =
      this.configService.get<string>('SMTP_SERVICE')?.trim() || 'gmail';

    this.smtpFromUser = smtpUser;
    this.transporter = nodemailer.createTransport(
      this.buildSmtpOptions({
        smtpUser,
        smtpPassword,
        smtpHost,
        smtpPortRaw,
        smtpSecureRaw,
        smtpService,
      }),
    );
  }

  private buildSmtpOptions(params: {
    smtpUser: string;
    smtpPassword: string | undefined;
    smtpHost: string | undefined;
    smtpPortRaw: string | undefined;
    smtpSecureRaw: string | undefined;
    smtpService: string;
  }): SMTPTransport.Options {
    const {
      smtpUser,
      smtpPassword,
      smtpHost,
      smtpPortRaw,
      smtpSecureRaw,
      smtpService,
    } = params;

    const auth = { user: smtpUser, pass: smtpPassword };
    const connectionTimeout = 25_000;

    if (smtpHost) {
      const port = smtpPortRaw ? Number(smtpPortRaw) : 587;
      const secure =
        smtpSecureRaw === 'true' ||
        (smtpSecureRaw !== 'false' && port === 465);
      return {
        host: smtpHost,
        port,
        secure,
        requireTLS: !secure && port !== 465,
        auth,
        connectionTimeout,
      };
    }

    // `service: 'gmail'` uses port 465 by default — often blocked; 587 + STARTTLS works more often.
    if (smtpService.toLowerCase() === 'gmail') {
      return {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth,
        connectionTimeout,
      };
    }

    return {
      service: smtpService,
      auth,
      connectionTimeout,
    };
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
