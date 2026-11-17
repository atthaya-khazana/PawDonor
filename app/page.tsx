'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api, errorMessage } from '@/lib/api-client';
import { speciesEmoji } from '@/lib/constants';
import { timeAgo } from '@/lib/hooks';
import type { DonationRequest, Donor, Stats } from '@/lib/types';
import { AvailabilityChip, BloodChip, UrgencyChip } from '@/components/ui/Badges';
import { PetAvatar } from '@/components/ui/PetAvatar';

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-2xl leading-tight">{title}</h2>
      {href && (
        <Link href={href} className="text-xs font-bold underline underline-offset-2">
          {linkLabel ?? 'View all'}
        </Link>
      )}
    </div>
  );
}

function Segments({ parts, label }: { parts: { value: number; className: string }[]; label: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white" role="img" aria-label={label}>
      {parts.map((p, i) => (p.value > 0 ? <span key={i} className={`block h-full ${p.className}`} style={{ width: `${(p.value / total) * 100}%` }} /> : null))}
    </div>
  );
}

function BarRow({ label, value, max, barClass, labelWidth }: { label: string; value: number; max: number; barClass: string; labelWidth: string }) {
  return (
    <li className="grid items-center gap-3 text-xs font-bold" style={{ gridTemplateColumns: `${labelWidth} 1fr 2rem` }}>
      <span className="truncate">{label}</span>
      <span className="h-3 overflow-hidden rounded-full bg-white">
        <span className={`block h-full rounded-full ${barClass}`} style={{ width: `${(value / max) * 100}%` }} />
      </span>
      <span className="text-right font-display text-sm">{value}</span>
    </li>
  );
}

function StripCell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="p-5 sm:p-6">
      <p className="text-sm font-bold text-cocoa/70">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  const load = useCallback(async () => {
    try {
      const [s, d, r] = await Promise.all([api.stats(), api.listDonors({ limit: '5' }), api.listRequests({ limit: '5' })]);
      setStats(s);
      setDonors(d);
      setRequests(r);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Top 6 blood types, the rest grouped as "Others".
  const bloodData = (() => {
    if (!stats) return [];
    const top = stats.bloodTypes.slice(0, 6).map((b) => ({
      label: `${speciesEmoji(b.species)} ${b.blood_type}`,
      value: b.count,
      other: false,
    }));
    const others = stats.bloodTypes.slice(6).reduce((sum, b) => sum + b.count, 0);
    return others ? [...top, { label: 'Others', value: others, other: true }] : top;
  })();
  const maxBlood = Math.max(1, ...bloodData.map((b) => b.value));
  const maxLocation = Math.max(1, ...(stats?.locations.map((l) => l.count) ?? [1]));

  const openCount = stats?.openRequests.length ?? 0;
  // Only open requests have a donor-match count; used for the "See donors" button.
  const candidatesById = new Map((stats?.openRequests ?? []).map((r) => [r.id, r.candidates]));
  const readyPct = stats && stats.donors.total > 0 ? Math.round((stats.donors.available / stats.donors.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <header>
        <div>
          <h1 className="page-title">{greeting}, pet lovers 🐾</h1>
          <p className="mt-1 text-sm font-semibold text-cocoa/80">
            {stats
              ? `${openCount} ${openCount === 1 ? 'request is' : 'requests are'} waiting for a donor, ${stats.donors.available} ${stats.donors.available === 1 ? 'donor is' : 'donors are'} ready to give.`
              : 'Checking the PawDonor registry…'}
          </p>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Could not load the dashboard: {error}
          <button type="button" className="btn btn-danger btn-sm" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {!stats && !error && (
        <div className="space-y-4" aria-busy="true">
          <div className="h-36 animate-pulse rounded-3xl bg-lavender" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-3xl bg-lavender" />
            <div className="h-64 animate-pulse rounded-3xl bg-lavender" />
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* Summary strip */}
          <div className="card grid grid-cols-1 divide-y divide-cocoa/10 bg-lilac p-0 text-grape md:grid-cols-3 md:divide-x md:divide-y-0">
            <StripCell title="Registered donors">
              <p className="font-display text-5xl leading-none">{stats.donors.total}</p>
              <div className="mt-4">
                <Segments
                  label={`${stats.donors.dogs} dogs and ${stats.donors.cats} cats`}
                  parts={[
                    { value: stats.donors.dogs, className: 'bg-grape' },
                    { value: stats.donors.cats, className: 'bg-orchid' },
                  ]}
                />
                <p className="mt-2 text-xs font-bold">
                  {stats.donors.dogs} dogs · {stats.donors.cats} cats
                </p>
              </div>
            </StripCell>

            <StripCell title="Ready to donate">
              <div className="flex items-center gap-4">
                <div
                  className="relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-b-2xl rounded-t-xl border-2 border-cocoa bg-white"
                  role="img"
                  aria-label={`${readyPct}% of donors are available`}
                >
                  <span className="absolute inset-x-0 bottom-0 bg-tangerine" style={{ height: `${readyPct}%` }} />
                </div>
                <div>
                  <p className="font-display text-5xl leading-none">{stats.donors.available}</p>
                  <p className="mt-2 text-xs font-bold">
                    {readyPct}% available · {stats.donors.unavailable} unavailable
                  </p>
                </div>
              </div>
            </StripCell>

            <StripCell title="Donation requests">
              <p className="font-display text-5xl leading-none">{stats.requests.total}</p>
              <div className="mt-4">
                <Segments
                  label="Requests by status"
                  parts={[
                    { value: stats.requests.pending, className: 'bg-tangerine' },
                    { value: stats.requests.in_progress, className: 'bg-grape' },
                    { value: stats.requests.completed, className: 'bg-lime' },
                  ]}
                />
                <p className="mt-2 text-xs font-bold">
                  {stats.requests.pending} pending · {stats.requests.in_progress} in progress · {stats.requests.completed} done
                </p>
              </div>
            </StripCell>
          </div>

          {/* Aligned 2x2 grid: every row has two equal-height cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="card bg-mango" aria-label="Recent donation requests">
              <SectionHeader title="Latest requests" href="/requests" />
              {requests.length === 0 ? (
                <p className="text-sm font-semibold">No requests yet.</p>
              ) : (
                <ul className="space-y-2">
                  {requests.map((r) => {
                    const candidates = candidatesById.get(r.id);
                    return (
                      <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-white/50 p-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl" aria-hidden="true">
                          {speciesEmoji(r.species)}
                        </span>
                        <div className="min-w-0 flex-1 basis-40">
                          <p className="truncate text-sm font-bold">{r.pet_name}</p>
                          <p className="truncate text-xs font-semibold text-cocoa/70">
                            {r.blood_type} · {r.location} · {timeAgo(r.created_at)}
                          </p>
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                          <UrgencyChip urgency={r.urgency} />
                          {candidates !== undefined && (
                            <Link href={`/requests?match=${r.id}`} className="btn btn-dark btn-sm">
                              See donors ({candidates})
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="card bg-lime" aria-label="Recently registered donors">
              <SectionHeader title="Newest donors" href="/donors" />
              {donors.length === 0 ? (
                <p className="text-sm font-semibold">No donors registered yet.</p>
              ) : (
                <ul className="space-y-2">
                  {donors.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-white/50 p-2.5">
                      <PetAvatar photo={d.photo_url} species={d.species} name={d.pet_name} size="sm" />
                      <div className="min-w-0 flex-1 basis-32">
                        <p className="truncate text-sm font-bold">{d.pet_name}</p>
                        <p className="truncate text-xs font-semibold text-cocoa/70">{d.location}</p>
                      </div>
                      <div className="ml-auto flex shrink-0 items-center gap-2">
                        <BloodChip type={d.blood_type} />
                        <AvailabilityChip available={d.is_available} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card bg-lavender" aria-label="Blood type distribution">
              <SectionHeader title="Blood types" />
              {bloodData.length === 0 ? (
                <p className="text-sm font-semibold">No data yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {bloodData.map((b) => (
                    <BarRow key={b.label} label={b.label} value={b.value} max={maxBlood} barClass={b.other ? 'bg-orchid' : 'bg-grape'} labelWidth="6.5rem" />
                  ))}
                </ul>
              )}
            </section>

            <section className="card bg-apricot" aria-label="Donors by location">
              <SectionHeader title="Donors by location" />
              {stats.locations.length === 0 ? (
                <p className="text-sm font-semibold">No data yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {stats.locations.map((l) => (
                    <BarRow key={l.location} label={l.location} value={l.count} max={maxLocation} barClass="bg-tangerine" labelWidth="6.5rem" />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
