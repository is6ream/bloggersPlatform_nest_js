import { API_BASE } from './config';
import type { ApiErrorBody } from '../types/api';

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? `Request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  useRefresh?: boolean;
  skipAuthRedirect?: boolean;
};

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(
    path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`,
    window.location.origin,
  );
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions & { query?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const { method = 'GET', body, token, useRefresh, query, skipAuthRedirect } = options;
  const headers: Record<string, string> = {};

  const authToken = token ?? accessToken;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const errorBody = (data ?? {}) as ApiErrorBody;
    if (
      response.status === 401 &&
      !skipAuthRedirect &&
      !useRefresh &&
      onUnauthorized
    ) {
      onUnauthorized();
    }
    throw new ApiError(response.status, errorBody);
  }

  return data as T;
}

export function buildQueryString(
  params: Record<string, string | number | undefined | null>,
): Record<string, string | number | undefined> {
  const result: Record<string, string | number | undefined> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  });
  return result;
}
