import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/appModule/appModule';
import { appSetup } from './setup/app.setup';
import { swaggerSetup } from './setup/swaggerSetup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  appSetup(app);
  swaggerSetup(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
