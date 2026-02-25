import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { UserModelType } from 'src/modules/user-accounts/domain/userEntity';


export async function createTestUser(userModel: UserModelType) {
  const password = 'testpassword';

  return await userModel.create({
    login: 'testuser',
    email: 'test@example.com',
    passwordHash: await bcrypt.hash(password, 10),
    emailConfirmation: {
      confirmationCode: "123212",
      expirationDate: new Date(),
      isConfirmed: true,
    },
    passwordRecovery: null,
  } as any);
}
