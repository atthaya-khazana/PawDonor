import type { DonationRequest, Donor, DonorMatch, Stats } from './types';

/** Error thrown for non-2xx API responses; `fields` carries per-field validation messages. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status, body?.fields);
  return body as T;
}

function withParams(path: string, params: Record<string, string> = {}) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) sp.set(key, value);
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

const send = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  stats: () => request<Stats>('/api/stats'),
  locations: () => request<string[]>('/api/locations'),

  listDonors: (params?: Record<string, string>) => request<Donor[]>(withParams('/api/donors', params)),
  createDonor: (data: unknown) => request<Donor>('/api/donors', send('POST', data)),
  updateDonor: (id: number, data: unknown) => request<Donor>(`/api/donors/${id}`, send('PUT', data)),
  deleteDonor: (id: number) => request<void>(`/api/donors/${id}`, send('DELETE')),

  listRequests: (params?: Record<string, string>) => request<DonationRequest[]>(withParams('/api/requests', params)),
  createRequest: (data: unknown) => request<DonationRequest>('/api/requests', send('POST', data)),
  updateRequest: (id: number, data: unknown) => request<DonationRequest>(`/api/requests/${id}`, send('PUT', data)),
  deleteRequest: (id: number) => request<void>(`/api/requests/${id}`, send('DELETE')),
  matches: (id: number) =>
    request<{ request: DonationRequest; matches: DonorMatch[]; disclaimer: string }>(`/api/requests/${id}/matches`),
};

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong');
