import { getRequest, listAvailableDonors } from '@/lib/queries';
import { findMatches } from '@/lib/matching';
import { badRequest, handleError, json, notFound, parseId } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/requests/:id/matches - candidate donors for one request.
// Preliminary discovery only: a veterinarian decides real compatibility.
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const id = parseId((await params).id);
    if (!id) return badRequest('Invalid request id');

    const request = await getRequest(id);
    if (!request) return notFound('Request');

    const donors = await listAvailableDonors(request.species);
    return json({
      request,
      matches: findMatches(request, donors),
      disclaimer:
        'Preliminary matches only. Final blood compatibility and donor eligibility must be determined by a veterinarian.',
    });
  } catch (err) {
    return handleError(err);
  }
}
