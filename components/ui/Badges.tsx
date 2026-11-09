import type { RequestStatus, Species, Urgency } from '@/lib/types';
import { speciesEmoji } from '@/lib/constants';

export function UrgencyChip({ urgency }: { urgency: Urgency }) {
  const styles: Record<Urgency, string> = {
    High: 'bg-red-600 text-white',
    Medium: 'bg-amber-200 text-amber-900',
    Low: 'bg-emerald-100 text-emerald-800',
  };
  return <span className={`chip ${styles[urgency]}`}>{urgency}</span>;
}

export function StatusChip({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    Pending: 'bg-white text-cocoa ring-1 ring-cocoa/20',
    'In Progress': 'bg-sky-100 text-sky-800',
    Completed: 'bg-emerald-100 text-emerald-800',
  };
  return <span className={`chip ${styles[status]}`}>{status}</span>;
}

export function AvailabilityChip({ available }: { available: boolean }) {
  return (
    <span className={`chip ${available ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-stone-400'}`} />
      {available ? 'Available' : 'Unavailable'}
    </span>
  );
}

export function BloodChip({ type }: { type: string }) {
  return <span className="chip bg-grape text-white">{type}</span>;
}

export function SpeciesLabel({ species }: { species: Species }) {
  return (
    <span>
      {speciesEmoji(species)} {species}
    </span>
  );
}
