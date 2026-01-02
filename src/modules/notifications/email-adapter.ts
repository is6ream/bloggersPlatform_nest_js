import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import * as dotenv from 'dotenv';
dotenv.config();

const configVariables = {
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SERVICE: process.env.SMTP_SERVICE,
};

@Injectable()
export class EmailAdapter {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'd.ilyasovunibell@gmail.com',
        pass: configVariables.SMTP_PASSWORD,
      },
    });
  }

  async sendConfirmationCodeEmail(
    email: string,
    code: string,
  ) /*: Promise<void>*/ {
    await this.transporter.sendMail({
      from: '"Confirm email" <d.ilyasovunibell@gmail.com>',
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
      from: '"Recovery code" <d.ilyasovunibell@gmail.com>',
      to: email,
      subject: 'Password Recovery',
      html: `<h1>Password recovery</h1>
            <p>To finish password recovery please follow the link below:
                <a href='https://somesite.com/password-recovery?recoveryCode=${code}'>recovery password</a>
            </p>`,
    });
  }
}
