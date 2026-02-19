import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AidCare — Naija Health Assistant',
  description:
    'AI-powered medical triage in Hausa, Yorùbá, Igbo, and Nigerian Pidgin. A Timbuktu Initiative × UNDP Nigeria Innovation Centre.',
  keywords: ['healthcare', 'Nigeria', 'Hausa', 'Yoruba', 'Igbo', 'Pidgin', 'AI', 'triage', 'UNDP'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
