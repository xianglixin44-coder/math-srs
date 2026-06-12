const BASE = 'http://localhost:3000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/cards`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  cards: {
    list: () => request<any[]>('/cards'),
    get: (id: string) => request<any>(`/cards/${id}`),
  },
  srs: {
    state: () => request<any[]>('/srs/state'),
    next: () => request<any[]>('/srs/next'),
    review: (card_id: string, dimension: string, score: number) =>
      request('/srs/review', {
        method: 'POST',
        body: JSON.stringify({ card_id, dimension, score }),
      }),
  },
  import: (cards: any[]) =>
    request<{ imported: number }>('/import', {
      method: 'POST',
      body: JSON.stringify(cards),
    }),
};
