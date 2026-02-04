import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { UserModelType } from 'src/modules/user-accounts/domain/userEntity';

type CreateTestUserParams = {
  login?: string;
  password?: string;
  email?: string;
  isConfirmed?: boolean;
};

export async function createTestUser(
  userModel: UserModelType,
  params: CreateTestUserParams = {},
) {
  const login = params.login ?? `user_${randomUUID().slice(0, 8)}`;
  const password = params.password ?? 'testpassword';
  const email = params.email ?? `${login}@test.local`;

  const passwordHash = await bcrypt.hash(password, 10); // hash нужен для validateUser [web:538]

  const user = await userModel.create({
    login,
    email,
    passwordHash,
    emailConfirmation: {
      confirmationCode: randomUUID(),
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isConfirmed: params.isConfirmed ?? true,
    },
    passwordRecovery: null,
    deleteAt: null,
  });

  return { user, password };
}
