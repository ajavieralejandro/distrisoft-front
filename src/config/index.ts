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

export function getDefaultApiBaseUrl(): string {
  const stored = localStorage.getItem(STORAGE_KEYS.API_URL);
  if (stored) return stored;
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
}

export function getDataSourceMode(): 'demo' | 'api' {
  const stored = localStorage.getItem(STORAGE_KEYS.DATA_SOURCE);
  if (stored === 'api' || stored === 'demo') {
    return stored;
  }
  return (import.meta.env.VITE_DATA_SOURCE as 'demo' | 'api') || 'demo';
}

export function setDataSourceMode(mode: 'demo' | 'api') {
  localStorage.setItem(STORAGE_KEYS.DATA_SOURCE, mode);
}

export function setApiBaseUrl(url: string) {
  localStorage.setItem(STORAGE_KEYS.API_URL, url);
}
