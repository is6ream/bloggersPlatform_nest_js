import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, code: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Email confirmation',
      text: `confirm registration via link https://some.com?code=${code}`,
    });
  }
}
