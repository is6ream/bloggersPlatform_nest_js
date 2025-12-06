import { CreateUserDto } from '../dto/UserInputDto';

export class CreateUserInputDto implements CreateUserDto {
  login: string;
  password: string;
  email: string;
}
