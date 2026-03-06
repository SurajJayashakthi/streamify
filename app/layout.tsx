import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';
import Sidebar from '@/components/Sidebar';

import ClientPlayer from '@/components/ClientPlayer';
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Streamify — Music & Video Streaming',
  description:
    'Discover, search, and stream millions of music videos and tracks powered by YouTube. Dark-themed, beautiful, and fast.',
  keywords: ['music streaming', 'video streaming', 'youtube music', 'streamify'],
  openGraph: {
    title: 'Streamify',
    description: 'Music & Video Streaming App',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="antialiased" style={{ background: '#09090b', color: '#fafafa' }}>
        {/* Sidebar (desktop fixed left / mobile bottom nav) */}
        <Sidebar />

        {/* Main content offset by sidebar width on desktop */}
        <div
          className="md:pl-[240px]"
          style={{ paddingBottom: '140px' }} // 60px nav + 80px player roughly on mobile. Wait, actual Tailwind pb could be used, but inline style pb is fine. Let's use Tailwind classes: min-h-screen pb-[140px] md:pb-[80px]
        >
          {children}
        </div>

        {/* Fixed bottom player — client-only */}
        <ClientPlayer />
      </body>
    </html>
  );
}
