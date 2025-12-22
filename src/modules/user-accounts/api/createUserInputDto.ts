import { Matches, Max, Min } from 'class-validator';
import { CreateUserDto } from '../dto/UserInputDto';

export class CreateUserInputDto implements CreateUserDto {
  @Max(10)
  @Min(3)
  @Matches('^[a-zA-Z0-9_-]*$')
  login: string;
  @Max(20)
  @Min(6)
  password: string;
  @Matches('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
  email: string;
}
