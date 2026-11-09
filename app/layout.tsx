import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/bagel-fat-one/400.css';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/fraunces';
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
