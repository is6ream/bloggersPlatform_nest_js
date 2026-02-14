import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app-module/app-module';
import { appSetup } from './setup/app.setup';
import * as dotenv from 'dotenv';
import { CoreConfig } from 'src/modules/app-module/core-config';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appConfig = app.get<CoreConfig>(CoreConfig);

  appSetup(app);
  const port = appConfig.port;
  console.log('...app listening on port: ', port);

  await app.listen(appConfig.port);
}
bootstrap();
