import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app-module/app-module';
import { appSetup } from './setup/app.setup';
import { CoreConfig } from 'src/modules/app-module/core-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  appSetup(app);
  const port = coreConfig.port;
  console.log('...app listening on port: ', port);

  await app.listen(coreConfig.port);
}
bootstrap();
