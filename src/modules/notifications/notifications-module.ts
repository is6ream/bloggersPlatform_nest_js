import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { EmailService } from './email-service';
import * as dotenv from 'dotenv';
dotenv.config();
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'd.ilyasovunibell@gmail.com',
          pass: 'enns kzmt jace sqfi',
        },
      },
      defaults: {
        from: process.env.SMTP_USER,
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
