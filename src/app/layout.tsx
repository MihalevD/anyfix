import './globals.css';
import type { Metadata } from 'next';
import MainLayout from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'AnyFix – Verified Masters for Your Home',
  description: 'Digital platform connecting property owners with verified specialists. Escrow protection. Reviews. Levels.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'AnyFix',
    description: 'Verified Masters for Your Home',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
