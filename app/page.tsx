'use client';

import Navbar from '@/components/Navbar';
import VideoGrid from '@/components/VideoGrid';

export default function HomePage() {
  return (
    <>
      {/* Fixed top navbar */}
      <Navbar />

      {/* Scrollable content below the 64px navbar */}
      <main
        className="main-scroll pt-[64px] px-2 sm:px-4 md:px-6 py-4 md:py-6"
        style={{ minHeight: '100vh' }}
      >
        <VideoGrid />
      </main>
    </>
  );
}
