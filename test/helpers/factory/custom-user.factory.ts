import { randomUUID } from 'crypto';
import { insertE2eUser } from '../../e2e/helpers/users-pg-e2e';
import type { E2eTestUser } from './user-factory';

type CreateTestUserParams = {
  login?: string;
  password?: string;
  email?: string;
  isConfirmed?: boolean;
};

export async function createCustomTestUser(params: CreateTestUserParams = {}) {
  const login = params.login ?? `u_${randomUUID().replace(/-/g, '').slice(0, 8)}`;
  const password = params.password ?? 'testpassword';
  const email = params.email ?? `${login}@test.local`;

  const user: E2eTestUser = await insertE2eUser({
    login,
    email,
    passwordPlain: password,
    isEmailConfirmed: params.isConfirmed ?? true,
  });

  return { user, password };
}
