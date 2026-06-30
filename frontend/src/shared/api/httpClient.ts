import { env } from '../config/env'

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function buildUrl(path: string): string {
  return `${env.apiBaseUrl}${env.apiPrefix}${normalizePath(path)}`
}

export class HttpError extends Error {
  public readonly status: number
  public readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`Request failed: ${status}`)
    this.name = 'HttpError'
    this.status = status
    this.body = body
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  token?: string | null
  body?: unknown
  withCredentials?: boolean
}

export async function requestJson<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    credentials: options.withCredentials ? 'include' : 'same-origin',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const responseText = await response.text()
  let parsedBody: unknown = null

  if (responseText) {
    try {
      parsedBody = JSON.parse(responseText)
    } catch {
      parsedBody = responseText
    }
  }

  if (!response.ok) {
    throw new HttpError(response.status, parsedBody)
  }

  return parsedBody as T
}

export async function requestVoid(
  path: string,
  options: RequestOptions = {},
): Promise<void> {
  await requestJson<null>(path, options)
}

export async function getJson<T>(path: string, token?: string): Promise<T> {
  return requestJson<T>(path, { token })
}
