import {
  deleteAllE2eUsers,
  findE2eUserIdByLogin,
  insertE2eUser,
} from '../../e2e/helpers/users-pg-e2e';

export type E2eTestUser = {
  id: string;
  login: string;
  email: string;
  password: string;
};

export async function createTestUser(
  overrides?: Partial<{
    login: string;
    email: string;
    password: string;
  }>,
): Promise<E2eTestUser> {
  const uniqueSuffix = Date.now().toString(36);
  const login = overrides?.login ?? `testuser_${uniqueSuffix}`;
  const email = overrides?.email ?? `test_${uniqueSuffix}@example.com`;
  const passwordPlain = overrides?.password ?? 'testpassword';

  const user = await insertE2eUser({
    login,
    email,
    passwordPlain,
    isEmailConfirmed: true,
  });

  return {
    ...user,
    password: passwordPlain,
  };
}

export { deleteAllE2eUsers, findE2eUserIdByLogin };
