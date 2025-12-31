import { Matches } from 'class-validator';

export class PasswordRecoveryInputDto {
  @Matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
  email: string;
}
