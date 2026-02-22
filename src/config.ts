import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
console.log('env: ', process.env.NODE_ENV);

export const configModule = ConfigModule.forRoot({
  envFilePath: [
    process.env.ENV_FILE_PATH?.trim() || '',
    join(__dirname, 'env', `.env.${process.env.NODE_ENV}.local`),
    join(__dirname, 'env', `.env.${process.env.NODE_ENV}`),
    join(__dirname, 'env', '.env.production'),
  ],
});
