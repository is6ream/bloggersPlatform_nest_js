import { IsString, Max, Min } from 'class-validator';

export class NewPasswordInputDto {
  @IsString()
  @Max(20)
  @Min(6)
  newPassword: string;
  @IsString()
  recoveryCode: string;
}
