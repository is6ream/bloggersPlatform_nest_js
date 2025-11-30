import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Put,
} from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  getUsers(@Query('term') term: string) {
    return [
      { id: 1, name: 'Dan' },
      { id: 2, name: 'Jam' },
      { id: 3, name: 'Ari' },
    ].filter((u) => !term || u.name.indexOf(term) > -1);
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
  @Delete(':id')
  deleteUser(@Param('id') userId: string) {
    return;
  }
  @Put(':id')
  updateUser(
    @Param('id') userId: string,
    @Body() model: CreateUserInputModelType,
  ) {
    return {
      id: userId,
      model: model,
    };
  }
}

type CreateUserInputModelType = {
  name: string;
  childrenCount: number;
};
