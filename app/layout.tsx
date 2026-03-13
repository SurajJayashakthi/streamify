import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
        <Sidebar />
        <MobileDrawer />
        {/* Main content area restricted and centered */}
        <div className="md:pl-[240px] w-full">
          <main className="max-w-screen-xl mx-auto w-full px-8 pt-24" style={{ paddingBottom: '140px' }}>
            {children}
          </main>
        </div>

        <ClientPlayer />
      </body>
    </html>
  );
}
