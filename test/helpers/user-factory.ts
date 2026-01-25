import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { UserModelType } from 'src/modules/user-accounts/domain/userEntity';

export async function createTestUser(
  userModel: UserModelType,
  overrides: Partial<any> = {},
) {
  const defaultData = {
    login: 'testuser',
    email: 'test@example.com',
    passwordHash: await bcrypt.hash('testpassword', 10),
    emailConfirmation: {
      confirmationCode: randomUUID(),
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isConfirmed: false,
    },
    passwordRecovery: null,
  };

  return userModel.create({ ...defaultData, ...overrides });
}
