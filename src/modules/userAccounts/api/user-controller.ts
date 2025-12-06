import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Delete,
  Body,
} from '@nestjs/common';
import { UsersQueryRepository } from '../infrastructure/usersQueryRepository';
import { UsersService } from '../application/user-service';
import { UserViewModel } from '../types/output/userViewModel';
import type { UserQueryInput } from 'src/common/pagination/user/userQueryInput';
import type { CreateUserInputDto } from '../dto/UserInputDto';
@Controller('users')
export class UserController {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private usersService: UsersService,
  ) {}
  //todo провести рефакторинг, подключить модули. Сегодня протестировать через постман
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(@Query() query: UserQueryInput): Promise<UserViewModel[]> {
    return await this.usersQueryRepository.findAll(query);
  }

  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewModel> {
    const userId: string = await this.usersService.create(body);

    return this.usersQueryRepository.findById(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
