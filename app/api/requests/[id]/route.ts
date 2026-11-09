import { query } from '@/lib/db';
import { getRequest } from '@/lib/queries';
import { badRequest, handleError, json, noContent, notFound, parseId, readBody } from '@/lib/http';
import { validateRequest } from '@/lib/validation';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/requests/:id
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const id = parseId((await params).id);
    if (!id) return badRequest('Invalid request id');
    const request = await getRequest(id);
    return request ? json(request) : notFound('Request');
  } catch (err) {
    return handleError(err);
  }
}

// PUT /api/requests/:id - full or partial update (missing fields keep their current value)
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const id = parseId((await params).id);
    if (!id) return badRequest('Invalid request id');

    const body = await readBody(req);
    if (typeof body !== 'object' || body === null) return badRequest('Request body must be a JSON object');

    const existing = await getRequest(id);
    if (!existing) return notFound('Request');

    const result = validateRequest({ ...existing, ...body });
    if (!result.ok) return badRequest('Validation failed', result.fields);

    const r = result.data;
    await query(
      `UPDATE donation_requests SET
         pet_name = $1, species = $2, blood_type = $3, location = $4, urgency = $5,
         notes = $6, status = $7, donor_id = $8, updated_at = NOW()
       WHERE id = $9`,
      [r.pet_name, r.species, r.blood_type, r.location, r.urgency, r.notes, r.status, r.donor_id, id],
    );
    return json(await getRequest(id));
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/requests/:id (204 No Content)
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const id = parseId((await params).id);
    if (!id) return badRequest('Invalid request id');
    const rows = await query<{ id: number }>('DELETE FROM donation_requests WHERE id = $1 RETURNING id', [id]);
    return rows.length ? noContent() : notFound('Request');
  } catch (err) {
    return handleError(err);
  }
}
