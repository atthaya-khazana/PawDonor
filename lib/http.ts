import { NextResponse } from 'next/server';

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export const noContent = () => new NextResponse(null, { status: 204 });

export const badRequest = (error: string, fields?: Record<string, string>) =>
  NextResponse.json({ error, ...(fields ? { fields } : {}) }, { status: 400 });

export const notFound = (what: string) =>
  NextResponse.json({ error: `${what} not found` }, { status: 404 });

/** Parses a path parameter into a positive int4, or null if it is not one. */
export function parseId(raw: string): number | null {
  if (!/^\d{1,10}$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 && n <= 2_147_483_647 ? n : null;
}

/** Reads a JSON body; returns undefined when the body is missing or invalid. */
export async function readBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

/** Maps database errors to sensible HTTP responses. */
export function handleError(err: unknown) {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
  if (code === '23503') return badRequest('Referenced record does not exist', { donor_id: 'Selected donor does not exist' });
  if (code === '23514') return badRequest('A value violates a database constraint');
  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT' || code.startsWith('08') || code.startsWith('57P')) {
    console.error('[api] database unavailable:', err);
    return NextResponse.json({ error: 'Database is unavailable' }, { status: 503 });
  }
  console.error('[api] unexpected error:', err);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
