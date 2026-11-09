import type { Donor } from '@/lib/types';
import { formatDate } from '@/lib/hooks';
import { AvailabilityChip, BloodChip } from '@/components/ui/Badges';
import { Icon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { PetAvatar } from '@/components/ui/PetAvatar';

interface Props {
  donor: Donor;
  busy: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
}

export function DonorDetail({ donor, busy, onClose, onEdit, onDelete, onToggleAvailability }: Props) {
  const facts: [string, string][] = [
    ['Species', donor.species],
    ['Breed', donor.breed],
    ['Age', `${donor.age_years} ${donor.age_years === 1 ? 'year' : 'years'}`],
    ['Weight', `${donor.weight_kg} kg`],
    ['Location', donor.location],
    ['Owner contact', donor.owner_contact],
    ['Registered', formatDate(donor.created_at)],
    ['Last updated', formatDate(donor.updated_at)],
  ];

  return (
    <Modal title="Donor details" onClose={onClose}>
      <div className="flex flex-wrap items-center gap-4">
        <PetAvatar photo={donor.photo_url} species={donor.species} name={donor.pet_name} size="lg" />
        <div className="space-y-2">
          <h3 className="text-3xl leading-tight">{donor.pet_name}</h3>
          <div className="flex flex-wrap gap-2">
            <BloodChip type={donor.blood_type} />
            <AvailabilityChip available={donor.is_available} />
          </div>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-lavender px-4 py-3">
            <dt className="text-xs font-bold uppercase tracking-wide text-cocoa/60">{label}</dt>
            <dd className="mt-0.5 break-words text-sm font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        Listing a pet here does not mean it is medically eligible. A veterinarian decides donor eligibility and blood
        compatibility.
      </p>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onToggleAvailability} disabled={busy}>
          <Icon name="check" /> Mark as {donor.is_available ? 'unavailable' : 'available'}
        </button>
        <button type="button" className="btn btn-dark" onClick={onEdit} disabled={busy}>
          <Icon name="edit" /> Edit
        </button>
        <button type="button" className="btn btn-danger" onClick={onDelete} disabled={busy}>
          <Icon name="trash" /> Delete
        </button>
      </div>
    </Modal>
  );
}
