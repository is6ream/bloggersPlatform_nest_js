import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

const env = process.env.NODE_ENV;
const projectRoot = process.cwd();

export const configModule = ConfigModule.forRoot({
  envFilePath: [
    process.env.ENV_FILE_PATH?.trim() || '',
    join(projectRoot, 'src', 'env', `.env.${env}.local`),
    join(projectRoot, 'src', 'env', `.env.${env}`),
    join(projectRoot, 'src', 'env', '.env.production'),
    join(projectRoot, 'dist', 'env', `.env.${env}.local`),
    join(projectRoot, 'dist', 'env', `.env.${env}`),
    join(projectRoot, 'dist', 'env', '.env.production'),
  ],
});
