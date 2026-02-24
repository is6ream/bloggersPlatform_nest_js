import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { UserModelType } from 'src/modules/user-accounts/domain/userEntity';


export async function createTestUser(userModel: UserModelType) {
  const password = 'testpassword';

  return await userModel.create({
    login: 'testuser',
    email: 'test@example.com',
    passwordHash: await bcrypt.hash(password, 10),

    // если у тебя есть обязательные поля в схеме —
    // просто ставим минимально валидные значения
    emailConfirmation: {
      confirmationCode: null,
      expirationDate: null,
      isConfirmed: true, // важно для логина
    },

    passwordRecovery: null,
  });
}
