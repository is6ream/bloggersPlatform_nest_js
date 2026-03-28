import { GLOBAL_PREFIX } from 'src/setup/globalPrefixSetup';

/** Полный путь API, например `auth/login` → `/hometask_17/api/auth/login` */
export function e2eApiPath(route: string): string {
  const r = route.startsWith('/') ? route.slice(1) : route;
  return `/${GLOBAL_PREFIX}/${r}`;
}
