'use client';

import Navbar from '@/components/Navbar';
import VideoGrid from '@/components/VideoGrid';
import ContinueWatching from '@/components/ContinueWatching';

export default function HomePage() {
  return (
    <>
      {/* Fixed top navbar */}
      <Navbar />

      {/* Scrollable content below the 64px navbar */}
      <main
        className="main-scroll pt-[64px] px-2 sm:px-4 md:px-6 py-4 md:py-6 overflow-x-hidden"
        style={{ minHeight: '100vh' }}
      >
        <div className="max-w-[2000px] mx-auto">
          <ContinueWatching />
          <VideoGrid />
        </div>
      </main>
    </>
  );
}
