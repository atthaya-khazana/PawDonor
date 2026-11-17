import type { Donor } from '@/lib/types';
import { AvailabilityChip, BloodChip } from '@/components/ui/Badges';
import { Icon } from '@/components/ui/Icons';

// `index` is still accepted so the page does not need to change, but cards are all white now.
export function DonorCard({ donor, onOpen }: { donor: Donor; index?: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex flex-col overflow-hidden rounded-3xl bg-white p-3 text-left shadow-[0_4px_20px_rgba(70,75,140,0.07)] transition hover:-translate-y-0.5 hover:shadow-lg ${
        donor.is_available ? '' : 'opacity-80'
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sunset/70">
        {donor.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={donor.photo_url}
            alt={`Photo of ${donor.pet_name}`}
            className="absolute inset-0 h-full w-full object-contain p-2"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={donor.species === 'Cat' ? '/dummy/cat.jpg' : '/dummy/dog.jpg'}
            alt={`${donor.species} avatar`}
            className="absolute inset-0 h-full w-full object-contain p-2"
          />
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
