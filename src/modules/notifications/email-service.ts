import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, code: string) {
    await this.mailerService.sendMail({});
  }
}
