import { IsString, IsNotEmpty } from 'class-validator';

export class LoginInputDto {
  @IsString({
    message: 'loginOrEmail must be a string',
  })
  @IsNotEmpty({
    message: 'loginOrEmail is required',
  })
  loginOrEmail: string;

  @IsString({
    message: 'Password must be a string',
  })
  @IsNotEmpty({
    message: 'Password is required',
  })
  password: string;
}
