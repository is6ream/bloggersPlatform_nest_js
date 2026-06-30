import { getJson, requestJson, requestVoid } from '../../../shared/api/httpClient'
import type { AuthUser, LoginPayload } from '../model/types'

type AccessTokenResponse = {
  accessToken: string
}

export function login(payload: LoginPayload): Promise<AccessTokenResponse> {
  return requestJson<AccessTokenResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    withCredentials: true,
  })
}

export function refreshToken(): Promise<AccessTokenResponse> {
  return requestJson<AccessTokenResponse>('/auth/refresh-token', {
    method: 'POST',
    withCredentials: true,
  })
}

export function getMe(accessToken: string): Promise<AuthUser> {
  return getJson<AuthUser>('/auth/me', accessToken)
}

export function logout(): Promise<void> {
  return requestVoid('/auth/logout', {
    method: 'POST',
    withCredentials: true,
  })
}
