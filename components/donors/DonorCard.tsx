import { speciesEmoji } from '@/lib/constants';
import type { Donor } from '@/lib/types';
import { AvailabilityChip, BloodChip } from '@/components/ui/Badges';
import { Icon } from '@/components/ui/Icons';

const TONES = ['bg-lilac/60', 'bg-mango/50', 'bg-orchid/50', 'bg-lime/50'];

export function DonorCard({ donor, index, onOpen }: { donor: Donor; index: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex flex-col overflow-hidden rounded-3xl p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${TONES[index % TONES.length]} ${
        donor.is_available ? '' : 'opacity-80'
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white/60">
        {donor.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={donor.photo_url} alt={`Photo of ${donor.pet_name}`} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl" aria-hidden="true">
            {speciesEmoji(donor.species)}
          </div>
        )}
        <span className="absolute left-2 top-2">
          <AvailabilityChip available={donor.is_available} />
        </span>
      </div>

      <div className="space-y-2 px-1 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl leading-tight">{donor.pet_name}</h3>
          <BloodChip type={donor.blood_type} />
        </div>
        <p className="text-sm font-semibold text-cocoa/80">
          {donor.species} · {donor.breed}
        </p>
        <p className="text-xs font-semibold text-cocoa/70">
          {donor.age_years} {donor.age_years === 1 ? 'year' : 'years'} · {donor.weight_kg} kg
        </p>
        <p className="flex items-center gap-1 text-xs font-bold text-cocoa/80">
          <Icon name="pin" className="h-3.5 w-3.5" /> {donor.location}
        </p>
      </div>
    </button>
  );
}
