const TOKEN_KEY       = "remind_auth_token"
const DISPLAY_NAME_KEY = "remind_display_name"
const API_BASE        = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getDisplayName(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DISPLAY_NAME_KEY)
}

export function saveSession(token: string, displayName: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(DISPLAY_NAME_KEY, displayName)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(DISPLAY_NAME_KEY)
}

export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return fetch(`${API_BASE}${path}`, { ...options, headers })
}
