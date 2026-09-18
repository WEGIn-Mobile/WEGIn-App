import { getAccessToken } from "@/lib/secure-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiFetch<T>(
    path: string, 
    options: RequestInit = {},
): Promise<T> {
    const token = await getAccessToken();

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',

            ...(token && {
            Authorization: `Bearer ${token}`,
            }),

            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}