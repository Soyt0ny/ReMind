// URL base de la API de producción.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://remind.soyt0ny.site';

// Token JWT activo — se carga desde AsyncStorage al iniciar la app.
let _token: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setApiToken(token: string | null) {
  _token = token;
}

export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
      _token = null;
      _onUnauthorized?.();
      throw new Error('UNAUTHORIZED');
    }
    const text = await response.text();
    throw new Error(text || `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenResponse {
  access_token: string;
  token_type:   string;
  user_id:      number;
  display_name: string;
}

export interface RegisterData {
  name:         string;
  relationship: string;
  image:        string;
  age?:         number;
  extra?:       string;
  phone?:       string;
}

export interface IdentifyResult {
  name:         string;
  relationship: string;
  confidence:   number;
  age?:         number;
  extra?:       string;
  photo?:       string;
  timestamp?:   number;
}

export interface Person {
  id:           number;
  name:         string;
  relationship: string;
  age?:         number;
  extra?:       string;
  phone?:       string;
  photo?:       string;
  created_at:   string;
}


// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export const api = {
  // Auth — estos dos no requieren token
  authRegister: (email: string, displayName: string, password: string) =>
    request<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, display_name: displayName, password }),
    }),

  authLogin: (email: string, password: string) =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    request<{ id: number; email: string; display_name: string }>('/auth/me'),

  // People — todos requieren token
  register: (data: RegisterData) =>
    request('/register', { method: 'POST', body: JSON.stringify(data) }),

  identify: (imageBase64: string) =>
    request<IdentifyResult>('/identify', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64 }),
    }),

  getPeople: () =>
    request<Person[]>('/people'),

  deletePerson: (id: number) =>
    request(`/people/${id}`, { method: 'DELETE' }),

  updatePerson: (id: number, data: Partial<RegisterData> & { is_emergency?: boolean }) =>
    request(`/people/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  verifyPassword: (password: string) =>
    request<{ ok: boolean }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
};
