'use client';

import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api-client';
import type { DonationRequest, DonorMatch } from '@/lib/types';
import { BloodChip, UrgencyChip } from '@/components/ui/Badges';
import { Icon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { PetAvatar } from '@/components/ui/PetAvatar';
import { useToast } from '@/components/ui/Toast';

interface Props {
  request: DonationRequest;
  onClose: () => void;
  onChanged: () => void;
}

export function MatchesModal({ request, onClose, onChanged }: Props) {
  const toast = useToast();
  const [current, setCurrent] = useState(request);
  const [matches, setMatches] = useState<DonorMatch[] | null>(null);
  const [disclaimer, setDisclaimer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .matches(request.id)
      .then((data) => {
        if (!alive) return;
        setMatches(data.matches);
        setDisclaimer(data.disclaimer);
        setCurrent(data.request);
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [request.id]);

  async function selectDonor(donorId: number | null, donorName?: string) {
    setBusy(true);
    try {
      const body =
        donorId === null
          ? { donor_id: null }
          : { donor_id: donorId, status: current.status === 'Pending' ? 'In Progress' : current.status };
      setCurrent(await api.updateRequest(request.id, body));
      toast(donorId === null ? 'Donor selection cleared' : `${donorName} selected for ${request.pet_name}`);
      onChanged();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Donors for ${request.pet_name}`} onClose={onClose} size="lg">
      <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
        <span>{request.species}</span>
        <BloodChip type={request.blood_type} />
        <span className="flex items-center gap-1">
          <Icon name="pin" className="h-3.5 w-3.5" /> {request.location}
        </span>
        <UrgencyChip urgency={request.urgency} />
      </div>

      <p className="mt-4 flex gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
        {disclaimer || 'Preliminary matches only. Final blood compatibility and donor eligibility must be determined by a veterinarian.'}
      </p>

      {current.donor_id && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-bold text-emerald-800">
            <Icon name="check" /> Selected donor: {current.donor_name}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => selectDonor(null)}>
            Clear selection
          </button>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        {!matches && !error && <div className="h-24 animate-pulse rounded-2xl bg-lavender" aria-busy="true" />}

        {matches?.length === 0 && (
          <div className="rounded-2xl bg-cream px-5 py-10 text-center">
            <p className="font-display text-2xl">No candidates yet</p>
            <p className="mt-1 text-sm text-cocoa/70">
              No available {request.species.toLowerCase()} with a compatible blood type is registered right now.
            </p>
          </div>
        )}

        {matches?.map(({ donor, blood_match, same_location }) => {
          const selected = current.donor_id === donor.id;
          return (
            <article key={donor.id} className={`flex flex-wrap items-center gap-4 rounded-2xl p-4 ${selected ? 'bg-emerald-50 ring-2 ring-emerald-400' : 'bg-lavender'}`}>
              <PetAvatar photo={donor.photo_url} species={donor.species} name={donor.pet_name} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg leading-tight">{donor.pet_name}</h3>
                  <BloodChip type={donor.blood_type} />
                  <span className={`chip ${blood_match === 'exact' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                    {blood_match === 'exact' ? 'Exact blood type' : 'Compatible type'}
                  </span>
                  <span className={`chip ${same_location ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                    {same_location ? 'Same city' : 'Different city'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-cocoa/70">
                  {donor.breed} · {donor.age_years} {donor.age_years === 1 ? 'yr' : 'yrs'} · {donor.weight_kg} kg · {donor.location}
                </p>
                <p className="flex items-center gap-1 break-all text-xs font-bold">
                  <Icon name="user" className="h-3.5 w-3.5 shrink-0" /> {donor.owner_contact}
                </p>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${selected ? 'btn-ghost' : 'btn-primary'}`}
                disabled={busy || selected}
                onClick={() => selectDonor(donor.id, donor.pet_name)}
              >
                {selected ? 'Selected' : 'Select donor'}
              </button>
            </article>
          );
        })}
      </div>
    </Modal>
  );
}
