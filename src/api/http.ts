import { getDefaultApiBaseUrl, STORAGE_KEYS } from '@/config';

export class ApiError extends Error {
  public isNetworkError: boolean;
  public url?: string;

  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
    url?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.isNetworkError = status === 0;
    this.url = url;
  }
}

export function getAuthToken(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') return null;
    return token.trim();
  } catch {
    return null;
  }
}

export function setAuthTokens(accessToken: string, refreshToken?: string) {
  try {
    if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken.trim());
    if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken.trim());
    }
  } catch {}
}

export function clearAuthTokens() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
  } catch {}
}

/**
 * Normaliza y construye la URL absoluta del endpoint API.
 * Evita duplicar `/api` si ya está presente en la base o en la ruta.
 */
export function buildApiUrl(path: string, customBaseUrl?: string): string {
  const rawBase = (customBaseUrl || getDefaultApiBaseUrl()).trim().replace(/\/+$/, '');
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Si la base ya incluye /api y la ruta también comienza con /api, quitamos el duplicado
  if (rawBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.slice(4);
  } else if (!rawBase.endsWith('/api') && !cleanPath.startsWith('/api')) {
    // Si la base no termina en /api y la ruta no inicia con /api, agregamos el prefijo canónico
    cleanPath = `/api${cleanPath}`;
  }

  return `${rawBase}${cleanPath}`;
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
  const url = buildApiUrl(path, options.baseUrl);

  const headers: Record<string, string> = {
    Accept: 'application/json',
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
      if (res.status === 401) {
        clearAuthTokens();
      }

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

      throw new ApiError(message, res.status, code, data, url);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }

    const rawMsg = err?.message || '';
    const isFetchFailure =
      err instanceof TypeError ||
      rawMsg.toLowerCase().includes('failed to fetch') ||
      rawMsg.toLowerCase().includes('networkerror') ||
      rawMsg.toLowerCase().includes('load failed');

    if (isFetchFailure) {
      const helpfulMsg =
        `No se pudo conectar con el servidor API (${url}). El backend en el puerto 8443 no responde, el certificado SSL no ha sido aceptado por tu navegador o la directiva CORS bloqueó la petición.`;
      throw new ApiError(helpfulMsg, 0, 'NETWORK_ERROR', err, url);
    }

    throw new ApiError(
      rawMsg || 'Error inesperado de comunicación con la API',
      0,
      'UNKNOWN_ERROR',
      err,
      url,
    );
  }
}

export async function probeServer(url?: string): Promise<{
  ok: boolean;
  message: string;
  status?: number;
  isSslOrCors?: boolean;
  targetUrl: string;
}> {
  const targetUrl = buildApiUrl('/health', url);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      return {
        ok: true,
        message: 'Servidor API online y respondiendo correctamente (/api/health OK).',
        status: res.status,
        targetUrl,
      };
    }

    return {
      ok: false,
      message: `El servidor respondió con código HTTP ${res.status} (${res.statusText || 'Error'}).`,
      status: res.status,
      targetUrl,
    };
  } catch (e: any) {
    const rawMsg = e?.message || '';
    const isFetchFailure =
      e instanceof TypeError ||
      rawMsg.toLowerCase().includes('failed to fetch') ||
      rawMsg.toLowerCase().includes('networkerror') ||
      rawMsg.toLowerCase().includes('load failed');

    const message = isFetchFailure
      ? `No se pudo conectar con ${targetUrl} (Failed to fetch). Comprobá que el backend esté activo en el puerto 8443, que el certificado SSL sea confiable en este navegador o que CORS_ORIGIN permita este origen.`
      : (rawMsg || 'No se pudo conectar al host.');

    return {
      ok: false,
      message,
      isSslOrCors: isFetchFailure,
      targetUrl,
    };
  }
}
