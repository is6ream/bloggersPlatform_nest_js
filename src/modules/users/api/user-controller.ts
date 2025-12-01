import { Controller, Get, Query } from '@nestjs/common';
import { UsersQueryRepository } from '../infrastructure/usersQueryRepository';
import { UsersService } from '../application/user-service';
import { UserViewModel } from '../types/output/userViewModel';
import type { UserQueryInput } from 'src/common/pagination/user/userQueryInput';
@Controller('users')
export class UserController {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private usersService: UsersService, //todo как расположить сервисы и репозитории
  ) {}

  @Get('users')
  async getAll(@Query() query: UserQueryInput): Promise<UserViewModel> {
    const res = await this.usersQueryRepository.findAll(query);
    console.log(res);
    return;
  }
}
