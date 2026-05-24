import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginInputDto {
  @ApiProperty({ example: 'test@email.com' })
  @IsString({
    message: 'loginOrEmail must be a string',
  })
  @IsNotEmpty({
    message: 'loginOrEmail is required',
  })
  loginOrEmail: string;

  @ApiProperty({ example: '123123123' })
  @IsString({
    message: 'Password must be a string',
  })
  @IsNotEmpty({
    message: 'Password is required',
  })
  password: string;
}
