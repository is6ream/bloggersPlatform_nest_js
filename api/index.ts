import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { type Express } from 'express';
import type { RequestListener } from 'http';
import { AppModule } from '../src/modules/app-module/app-module';
import { appSetup } from '../src/setup/app.setup';

let cachedServer: Express | null = null;

async function bootstrap(): Promise<Express> {
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
  const server = cachedServer ?? (cachedServer = await bootstrap());
  const listener = server as unknown as RequestListener;
  return listener(req, res);
}