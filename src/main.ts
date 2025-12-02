import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/appModule/appModule';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  app.enableCors();
  app.setGlobalPrefix('hometask_13/api');
}
bootstrap();
