export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.domain-lms-anda.com';

export const BASE_URL = API_BASE_URL.endsWith('/')
  ? API_BASE_URL.slice(0, -1)
  : API_BASE_URL;

export function buildAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export function buildJsonHeaders(token?: string): Record<string, string> {
  return buildAuthHeaders(token);
}

export function buildMultipartHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function readApiResponse<T>(
  response: Response,
): Promise<T | string | null> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text) return null;

  if (contentType.includes('application/json')) {
    return JSON.parse(text) as T;
  }

  return text;
}

export async function requestJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  const result = await readApiResponse<{
    message?: string;
    error?: string;
    data?: {
      message?: string;
    };
  }>(response);

  if (!response.ok) {
    const message =
      typeof result === 'object' && result !== null
        ? result.message ||
          result.error ||
          result.data?.message ||
          `HTTP error! status: ${response.status}`
        : `HTTP error! status: ${response.status}`;

    throw new Error(message);
  }

  return result as T;
}