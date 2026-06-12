import type { Card } from '../types/card';

const BASE = `${window.location.origin}/api`;

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

export interface BrowseCardSummary {
  id: string;
  title: string;
  category?: string;
  sectionCount: number;
}

export interface BrowseSection {
  key: string;
  label: string;
  content: string;
}

export interface BrowseCard {
  id: string;
  title: string;
  category?: string;
  sections: BrowseSection[];
}

export interface SRSState {
  card_id: string;
  ease_factor: number;
  interval: number;
  due_date: string;
  reps: number;
  last_review: string | null;
}

export const api = {
  cards: {
    list: () => request<Card[]>('/cards'),
    get: (id: string) => request<Card>(`/cards/${id}`),
  },
  srs: {
    state: () => request<SRSState[]>('/srs/state'),
    next: () => request<Card[]>('/srs/next'),
    review: (card_id: string, dimension: string, score: number) =>
      request('/srs/review', {
        method: 'POST',
        body: JSON.stringify({ card_id, dimension, score }),
      }),
  },
  browse: {
    list: () => request<BrowseCardSummary[]>('/browse/cards'),
    get: (id: string) => request<BrowseCard>(`/browse/cards/${id}`),
  },
  symbols: {
    recognize: (strokes: number[][][]) =>
      request<{ symbol: string; confidence: number }[]>('/symbols/recognize', {
        method: 'POST',
        body: JSON.stringify({ strokes }),
      }),
  },
  import: (cards: any[]) =>
    request<{ imported: number }>('/import', {
      method: 'POST',
      body: JSON.stringify(cards),
    }),
};
