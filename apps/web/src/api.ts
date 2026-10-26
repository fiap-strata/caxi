let csrf = '';
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
export function setCsrf(value: string) {
  csrf = value;
}
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const multipart = options.body instanceof FormData;
  const response = await fetch('/api' + path, {
    ...options,
    credentials: 'include',
    headers: {
      ...(!multipart && options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      ...options.headers,
    },
  });
  const data = await response
    .json()
    .catch(() => ({ message: 'O servidor não respondeu como esperado.' }));
  if (!response.ok)
    throw new ApiError(
      Array.isArray(data.message)
        ? data.message[0]
        : data.message || 'Não foi possível concluir. Tente novamente.',
      response.status,
    );
  return data;
}
export const send = (body: unknown) => JSON.stringify(body);
