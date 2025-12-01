import { Controller } from '@nestjs/common';

@Controller('users')
export class UserController {
  constructor(
    private usersQueryRepository,
    private usersService, //todo как расположить сервисы и репозитории
  ) {}
}
