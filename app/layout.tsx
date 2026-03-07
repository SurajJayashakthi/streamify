import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import MobileDrawer from '@/components/MobileDrawer';

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
      <body className="antialiased selection:bg-indigo-500/30">
        {/* Sidebar (desktop fixed left / mobile bottom nav) */}
        <Sidebar />
        <MobileDrawer />

        {/* Main content offset by sidebar width on desktop */}
        <div
          className="md:pl-[240px] px-6"
          style={{ paddingBottom: '140px' }}
        >
          {children}
        </div>

        {/* Fixed bottom player — client-only */}
        <ClientPlayer />
      </body>
    </html>
  );
}
