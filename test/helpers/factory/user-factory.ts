import {
  deleteAllE2eUsers,
  findE2eUserIdByLogin,
  insertE2eUser,
} from '../../e2e/helpers/users-pg-e2e';

export type E2eTestUser = {
  id: string;
  login: string;
  email: string;
};

export async function createTestUser(
  overrides?: Partial<{
    login: string;
    email: string;
    password: string;
  }>,
): Promise<E2eTestUser> {
  const login = overrides?.login ?? 'testuser';
  const email = overrides?.email ?? 'test@example.com';
  const passwordPlain = overrides?.password ?? 'testpassword';

  return insertE2eUser({
    login,
    email,
    passwordPlain,
    isEmailConfirmed: true,
  });
}

export { deleteAllE2eUsers, findE2eUserIdByLogin };
