import { IsString, Length } from 'class-validator';

export class NewPasswordInputDto {
  @IsString()
  @Length(6, 20, {
    message: 'Password must be between 6 and 20 characters',
  })
  newPassword: string;

  @IsString()
  recoveryCode: string;
}
