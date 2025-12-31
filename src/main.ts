import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app-module/appModule';
import { appSetup } from './setup/app.setup';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  appSetup(app);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log('...app listening on port: ', port);
}
bootstrap();
