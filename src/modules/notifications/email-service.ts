import { Injectable } from '@nestjs/common';
import { EmailAdapter } from './email-adapter';
@Injectable()
export class EmailService {
  constructor(private EmailAdapter: EmailAdapter) {}

  async sendConfirmationEmail(email: string, code: string) {
    await this.EmailAdapter.sendConfirmationCodeEmail(email, code);
  }
}
