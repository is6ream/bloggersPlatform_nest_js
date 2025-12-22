import { IsEmail, Matches, Length, IsString } from 'class-validator';

export class CreateUserInputDto {
  @Matches(/^[a-zA-Z0-9_-]{3,10}$/)
  @IsString()
  login: string;

  @Length(6, 20)
  @IsString()
  password: string;

  @IsEmail()
  @IsString()
  email: string;
}
