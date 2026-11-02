import { getDefaultApiBaseUrl, STORAGE_KEYS } from '@/config';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function setAuthTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    baseUrl?: string;
  } = {},
): Promise<T> {
  const baseUrl = (options.baseUrl || getDefaultApiBaseUrl()).replace(/\/+$/, '');
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let bodyContent: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyContent = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: bodyContent,
    });

    if (res.status === 204) {
      return {} as T;
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message =
        typeof data === 'object' && data !== null && 'message' in data
          ? Array.isArray((data as any).message)
            ? (data as any).message.join(', ')
            : String((data as any).message)
          : `Error HTTP ${res.status}`;
      const code =
        typeof data === 'object' && data !== null && 'code' in data
          ? String((data as any).code)
          : undefined;

      throw new ApiError(message, res.status, code, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      err?.message || 'Error de conexión con el servidor API',
      0,
      'NETWORK_ERROR',
      err,
    );
  }
}

export async function probeServer(url?: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const baseUrl = url || getDefaultApiBaseUrl();
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      return { ok: true, message: 'Servidor API online y respondiendo' };
    }
    return { ok: false, message: `El servidor respondió con código ${res.status}` };
  } catch (e: any) {
    return { ok: false, message: e.message || 'No se pudo conectar al host' };
  }
}
