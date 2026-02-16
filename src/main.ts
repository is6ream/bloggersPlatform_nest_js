import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app-module/app-module';
import { appSetup } from './setup/app.setup';
import { CoreConfig } from 'src/modules/app-module/core-config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  if (coreConfig.isSwaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Bloggers platform')
      .setDescription('The API description')
      .setVersion('1.0')
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
  }

  appSetup(app);
  const port = coreConfig.port;
  console.log('...app listening on port: ', port);

  await app.listen(coreConfig.port);
}
bootstrap();

//todo - сделать AuthConfig для работы с переменными окружения ветки Auth