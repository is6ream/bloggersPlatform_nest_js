import type { IncomingHttpHeaders } from 'http';

export type HttpRequestWithUser<TUser = unknown> = {
  headers: IncomingHttpHeaders;
  secure?: boolean;
  get?: (name: string) => string | undefined;
  user?: TUser;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

export type CookieResponse = {
  cookie: (
    name: string,
    value: string,
    options?: object,
  ) => void;
  clearCookie: (name: string, options?: object) => void;
};
