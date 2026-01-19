import { Request } from 'express';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';
// 1. Расширяем интерфейс Request из Express
declare global {
  namespace Express {
    interface Request {
      user?: UserContextDto; // ← Говорим TypeScript, что у Request может быть user
    }
  }
}
