import { IsString } from 'class-validator';

export class PasswordConfirmationInputDto {
  @IsString()
  code: string;
}
