import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GLOBAL_PREFIX } from './globalPrefixSetup';
import { CoreConfig } from 'src/modules/app-module/core-config';
import { Enviroments } from 'src/modules/app-module/types/env-enums';

export function swaggerSetup(app: INestApplication) {
  const coreConfig = app.get<CoreConfig>(CoreConfig);
  const shouldGenerateSwagger =
    coreConfig.env === Enviroments.DEVELOPMENT ||
    coreConfig.env === Enviroments.PRODUCTION;

  if (!shouldGenerateSwagger) {
    return app;
  }

  const config = new DocumentBuilder()
    .setTitle('Bloggers platform')
    .setDescription('The API description')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const swaggerPath = `${GLOBAL_PREFIX}/docs`;
  SwaggerModule.setup(swaggerPath, app, documentFactory, {
    customSiteTitle: 'Blogger Swagger',
  });
  const swaggerUrl = `http://localhost:${coreConfig.port}/${swaggerPath}`;
  console.log(
    `Swagger UI available at ${swaggerUrl}`,
  );

  return app;
}
