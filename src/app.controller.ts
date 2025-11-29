import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  getAll() {
    return 'This action return all users';
  }
  @Get('default-category')
  getMyBooks() {
    return 'This action returns users by default category';
  }
}
