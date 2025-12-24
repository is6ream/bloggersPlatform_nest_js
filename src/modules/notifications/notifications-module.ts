import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_LOGIN,
          pass: process.env.GMAIL_PASSWORD,
        },
      },
      defaults: {
        from: process.env.GMAIL_LOGIN,
      },
    }),
  ],
  exports: [],
})
export class NotificationsModule {}
