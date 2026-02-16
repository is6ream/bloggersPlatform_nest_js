import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GLOBAL_PREFIX } from './globalPrefixSetup';
import { CoreConfig } from 'src/modules/app-module/core-config';

export function swaggerSetup(app: INestApplication) {
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
    console.log(
      `Swagger UI available at http://localhost:${process.env.PORT ?? 3000}/${swaggerPath}`,
    );

  return app;
}
