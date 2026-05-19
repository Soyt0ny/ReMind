const TOKEN_KEY       = "remind_auth_token"
const DISPLAY_NAME_KEY = "remind_display_name"
const USER_ID_KEY      = "remind_user_id"
const API_BASE        = process.env.NEXT_PUBLIC_API_URL || "https://remind.soyt0ny.site"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getDisplayName(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DISPLAY_NAME_KEY)
}

export function saveSession(token: string, displayName: string, userId: number) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(DISPLAY_NAME_KEY, displayName)
  localStorage.setItem(USER_ID_KEY, userId.toString())
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(DISPLAY_NAME_KEY)
  localStorage.removeItem(USER_ID_KEY)
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
