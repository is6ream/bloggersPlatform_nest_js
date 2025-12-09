import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/appModule/appModule';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      //class-transforrmer создает экземпляр dto
      //применяются значения по умолчанию, прописанные в bqprms
      //и методы классов dto
      transform: true,
    }),
  );
  app.setGlobalPrefix('hometask_13/api');
}
bootstrap();


