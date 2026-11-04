export const STORAGE_KEYS = {
  DATA_SOURCE: 'distrisoft_data_source',
  API_URL: 'distrisoft_api_url',
  ACCESS_TOKEN: 'distrisoft_access_token',
  REFRESH_TOKEN: 'distrisoft_refresh_token',
  SESSION_USER: 'distrisoft_session_user',
  MOCK_PRODUCTS: 'distrisoft_mock_products',
  MOCK_COMMERCES: 'distrisoft_mock_commerces',
  MOCK_ORDERS: 'distrisoft_mock_orders',
  REGISTERED_LEADS: 'distrisoft_registered_leads',
};

export const DEFAULT_PRODUCTION_API_URL = 'https://distrisoft.duckdns.org:8443/api';

export function getDefaultApiBaseUrl(): string {
  const envUrl = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    ''
  ).trim();

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.API_URL);
    if (stored && stored.trim().length > 0) {
      const trimmed = stored.trim();
      // Si estamos en entorno HTTPS (ej: https://distrifront.duckdns.org) pero localStorage tiene http://localhost,
      // descartamos el valor viejo para evitar bloqueos por Mixed Content
      if (
        typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        trimmed.startsWith('http://')
      ) {
        localStorage.removeItem(STORAGE_KEYS.API_URL);
      } else {
        return trimmed;
      }
    }
  } catch {
    // localStorage inaccesible
  }

  if (envUrl.length > 0) {
    return envUrl;
  }

  return DEFAULT_PRODUCTION_API_URL;
}

export function getDataSourceMode(): 'demo' | 'api' {
  const envMode = (import.meta.env.VITE_DATA_SOURCE as 'demo' | 'api') || undefined;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DATA_SOURCE);
    if (stored === 'api' || stored === 'demo') {
      return stored;
    }
  } catch {}

  return envMode || 'api';
}

export function setDataSourceMode(mode: 'demo' | 'api') {
  try {
    localStorage.setItem(STORAGE_KEYS.DATA_SOURCE, mode);
  } catch {}
}

export function setApiBaseUrl(url: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.API_URL, url.trim());
  } catch {}
}

export function resetApiBaseUrl() {
  try {
    localStorage.removeItem(STORAGE_KEYS.API_URL);
  } catch {}
}
