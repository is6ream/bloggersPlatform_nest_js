import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app-module/app-module';
import { appSetup } from './setup/app.setup';
import * as dotenv from 'dotenv';
import { AppConfig } from 'src/modules/app-module/app-config';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appConfig = app.get<AppConfig>(AppConfig);

  appSetup(app);
  const port = appConfig.port;
  console.log('...app listening on port: ', port);

  await app.listen(appConfig.port);
}
bootstrap();
