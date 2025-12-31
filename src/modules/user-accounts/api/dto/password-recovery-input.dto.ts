import { Matches } from 'class-validator';

export class PasswordRecoveryInputModel {
  @Matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
  email: string;
}
