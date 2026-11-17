'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Icon, type IconName } from './ui/Icons';
import { ToastProvider } from './ui/Toast';

// `short` is the label used on small screens, where the menu becomes a row of three tabs.
const NAV: { href: string; label: string; short: string; icon: IconName }[] = [
  { href: '/', label: 'Dashboard', short: 'Dashboard', icon: 'dashboard' },
  { href: '/donors', label: 'Donor Directory', short: 'Donors', icon: 'paw' },
  { href: '/requests', label: 'Donation Requests', short: 'Requests', icon: 'clipboard' },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [term, setTerm] = useState('');

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  // The donor directory has its own (live) search box, so the global one is hidden there.
  const showSearch = !pathname.startsWith('/donors');

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    router.push(`/donors?q=${encodeURIComponent(term.trim())}`);
    setTerm('');
  }

  return (
    <ToastProvider>
      <div className="mx-auto max-w-[1440px] sm:p-5">
        <div className="flex min-h-screen flex-col gap-3 bg-white p-3 shadow-xl sm:min-h-[calc(100vh-2.5rem)] sm:rounded-[2rem] lg:flex-row lg:gap-4 lg:p-4">
          <aside className="flex shrink-0 flex-col rounded-3xl bg-cocoa p-4 text-white lg:sticky lg:top-8 lg:h-[calc(100vh-4.5rem)] lg:w-60 lg:self-start lg:p-5">
            <Link href="/" className="flex items-center gap-2 font-display text-3xl uppercase leading-none">
              <Icon name="paw" className="h-7 w-7 text-tangerine" />
              PawDonor
            </Link>

            <nav aria-label="Main" className="mt-4 flex gap-1.5 lg:mt-10 lg:flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  aria-label={item.label}
                  className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2 py-2.5 text-xs font-bold transition sm:text-sm lg:flex-none lg:justify-start lg:gap-2.5 lg:px-3.5 ${
                    isActive(item.href) ? 'bg-tangerine text-white' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon name={item.icon} className="hidden h-4 w-4 sm:block" />
                  <span className="lg:hidden">{item.short}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-auto hidden rounded-2xl bg-white/10 p-4 text-xs leading-relaxed text-white/80 lg:block">
              <p className="mb-1 flex items-center gap-1.5 font-bold text-white">
                <Icon name="alert" className="h-4 w-4 text-tangerine" /> Vet check required
              </p>
              PawDonor only helps you discover candidates. A veterinarian must confirm blood compatibility and donor
              eligibility.
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-6 px-1 pb-4 pt-1 lg:px-3">
            <header className="flex flex-wrap items-center gap-3">
              {showSearch ? (
                <form onSubmit={submitSearch} role="search" className="relative w-full max-w-xs">
                  <Icon name="search" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/60" />
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Search donor by pet name..."
                    aria-label="Search donors by pet name"
                    className="w-full rounded-full bg-zinc-100 py-2.5 pl-10 pr-4 text-sm font-semibold outline-none placeholder:font-semibold placeholder:text-cocoa/50 focus:ring-2 focus:ring-tangerine/40"
                  />
                </form>
              ) : (
                <span />
              )}
              <div className="ml-auto flex flex-wrap gap-2">
                <Link href="/requests?new=1" className="btn btn-dark btn-sm">
                  <Icon name="plus" /> New request
                </Link>
                <Link href="/donors?new=1" className="btn btn-primary btn-sm">
                  <Icon name="plus" /> Register donor
                </Link>
              </div>
            </header>

            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
