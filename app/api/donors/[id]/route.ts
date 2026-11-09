import { query } from '@/lib/db';
import { DONOR_COLUMNS, getDonor } from '@/lib/queries';
import { badRequest, handleError, json, noContent, notFound, parseId, readBody } from '@/lib/http';
import { validateDonor } from '@/lib/validation';
import type { Donor } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/donors/:id
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const id = parseId((await params).id);
    if (!id) return badRequest('Invalid donor id');
    const donor = await getDonor(id);
    return donor ? json(donor) : notFound('Donor');
  } catch (err) {
    return handleError(err);
  }
}

// PUT /api/donors/:id - full or partial update (missing fields keep their current value)
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const id = parseId((await params).id);
    if (!id) return badRequest('Invalid donor id');

    const body = await readBody(req);
    if (typeof body !== 'object' || body === null) return badRequest('Request body must be a JSON object');

    const existing = await getDonor(id);
    if (!existing) return notFound('Donor');

    const result = validateDonor({ ...existing, ...body });
    if (!result.ok) return badRequest('Validation failed', result.fields);

    const d = result.data;
    const rows = await query<Donor>(
      `UPDATE donors SET
         pet_name = $1, photo_url = $2, species = $3, breed = $4, age_years = $5,
         weight_kg = $6, blood_type = $7, location = $8, owner_contact = $9,
         is_available = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING ${DONOR_COLUMNS}`,
      [d.pet_name, d.photo_url, d.species, d.breed, d.age_years, d.weight_kg, d.blood_type, d.location, d.owner_contact, d.is_available, id],
    );
    return rows[0] ? json(rows[0]) : notFound('Donor');
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/donors/:id (204 No Content). Requests that picked this donor keep existing.
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const id = parseId((await params).id);
    if (!id) return badRequest('Invalid donor id');
    const rows = await query<{ id: number }>('DELETE FROM donors WHERE id = $1 RETURNING id', [id]);
    return rows.length ? noContent() : notFound('Donor');
  } catch (err) {
    return handleError(err);
  }
}
