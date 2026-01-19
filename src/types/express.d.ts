import { Request } from 'express';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';
declare global {
  namespace Express {
    interface Request {
      user?: UserContextDto;
    }
  }
}
