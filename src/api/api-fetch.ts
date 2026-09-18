const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiFetch<T>(
    path: string, 
    options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error('Erro na requisição');
  }

  return response.json();
}