const DEFAULT_API_BASE_URL = 'http://localhost:3000'
const DEFAULT_API_PREFIX = '/hometask_25/api'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function normalizePrefix(value: string): string {
  if (!value) {
    return ''
  }

  const withSingleLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withSingleLeadingSlash.replace(/\/+$/, '')
}

export const env = {
  apiBaseUrl: trimTrailingSlash(
    import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  ),
  apiPrefix: normalizePrefix(
    import.meta.env.VITE_API_PREFIX ?? DEFAULT_API_PREFIX,
  ),
}
