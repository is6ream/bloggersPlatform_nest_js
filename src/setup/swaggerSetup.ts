import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GLOBAL_PREFIX } from './globalPrefixSetup';

export function swaggerSetup(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('BLOGGER API')
    .addBearerAuth()
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerPath = `${GLOBAL_PREFIX}/docs`;
  SwaggerModule.setup(swaggerPath, app, document, {
    customSiteTitle: 'Blogger Swagger',
  });
  console.log(
    `Swagger UI available at http://localhost:${process.env.PORT ?? 3000}/${swaggerPath}`,
  );
}
