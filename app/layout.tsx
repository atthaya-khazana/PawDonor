import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/fredoka';
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';
import { Shell } from '@/components/Shell';

export const metadata: Metadata = {
  title: 'PawDonor - Pet Blood Donor Registry',
  description: 'Find and register potential blood donors for cats and dogs.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
