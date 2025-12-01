import { Controller, Get, Query } from '@nestjs/common';
import { UsersQueryRepository } from '../infrastructure/usersQueryRepository';
import { UsersService } from '../application/user-service';
import { UserViewModel } from '../types/output/userViewModel';
import { PaginationQueryDto } from '../types/input/userQueryDto';
@Controller('users')
export class UserController {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private usersService: UsersService, //todo как расположить сервисы и репозитории
  ) {}

  @Get()
  async getAll(@Query() query: PaginationQueryDto): Promise<UserViewModel[]> {
    return await this.usersQueryRepository.getAll(query);
  }
}
