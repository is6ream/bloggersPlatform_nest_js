import { IsString } from 'class-validator';

export class AuthUserInputDto {
  @IsString()
  loginOrEmail: string;
  @IsString()
  password: string;
}
