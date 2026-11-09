import type { Donor, DonorMatch, Species } from './types';

/**
 * Simplified, PRELIMINARY blood compatibility rules, only meant to shortlist
 * candidates. A veterinarian must confirm real compatibility (cross-match,
 * health screening, donor eligibility).
 *
 *  - Same blood type is always an "exact" match.
 *  - Dogs: a DEA 1.1+ patient can also receive DEA 1.1- blood.
 *  - Cats:  an AB patient can also receive type A blood.
 *  - Everything else (e.g. cat type B) only matches exactly.
 */
export function bloodMatch(species: Species, recipient: string, donor: string): 'exact' | 'compatible' | null {
  if (recipient === donor) return 'exact';
  if (species === 'Dog' && recipient === 'DEA 1.1+' && donor === 'DEA 1.1-') return 'compatible';
  if (species === 'Cat' && recipient === 'AB' && donor === 'A') return 'compatible';
  return null;
}

const sameCity = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

interface MatchCriteria {
  species: Species;
  blood_type: string;
  location: string;
}

/**
 * Hard filters: same species, donor is available, blood type compatible.
 * Ranking: exact blood type first (a "compatible" match is a weaker fit),
 * then same location, then newest registration.
 */
export function findMatches(request: MatchCriteria, donors: Donor[]): DonorMatch[] {
  const matches: DonorMatch[] = [];

  for (const donor of donors) {
    if (donor.species !== request.species || !donor.is_available) continue;
    const blood = bloodMatch(request.species, request.blood_type, donor.blood_type);
    if (!blood) continue;

    const same_location = sameCity(donor.location, request.location);
    matches.push({
      donor,
      blood_match: blood,
      same_location,
      score: (blood === 'exact' ? 2 : 0) + (same_location ? 1 : 0),
    });
  }

  return matches.sort(
    (a, b) => b.score - a.score || +new Date(b.donor.created_at) - +new Date(a.donor.created_at),
  );
}
