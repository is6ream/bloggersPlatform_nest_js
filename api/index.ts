import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { AppModule } from '../src/modules/app-module/app-module';
import { appSetup } from '../src/setup/app.setup';

let cachedServer: express.Express | null = null;

async function bootstrap() {
  const expressApp = express();

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  appSetup(app);
  await app.init();

  return expressApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cachedServer ??= await bootstrap();
  return cachedServer(req, res);
}