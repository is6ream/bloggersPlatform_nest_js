import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersQueryRepository } from '../infrastructure/users/usersQueryRepository';
import { UsersService } from '../application/user-service';
import { UserViewModel } from '../types/output/userViewModel';
import { CreateUserInputDto } from './dto/input/create-user.input.dto';
import { GetUsersQueryParams } from './dto/output/get-users-query-params.input.dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { UserViewDto } from './dto/output/user.view-dto';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';

@Controller('users')
@UseGuards(BasicAuthGuard)
export class UserController {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private usersService: UsersService,
  ) {}
  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto>> {
    return this.usersQueryRepository.getAll(query);
  }

  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewModel> {
    const userId: string = await this.usersService.createUser(body);
    return this.usersQueryRepository.getByIdOrNotFoundFail(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.deleteUser(id);
  }
}
