import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { identity } from 'rxjs';

@Controller('users')
export class UsersController {
  @Get()
  getUsers() {
    return [{ id: 1 }, { id: 2 }];
  }
  @Post()
  createUsers(@Body() inputModel: CreateUserInputModelType) {
    return {
      id: 12,
      name: inputModel.name,
      childrenCount: inputModel.childrenCount,
    };
  }
  @Get(':id')
  getUser(@Param('id') userId: string) {
    return [{ id: 1 }, { id: 2 }].find((u) => u.id === +userId);
  }
}

type CreateUserInputModelType = {
  name: string;
  childrenCount: number;
};
