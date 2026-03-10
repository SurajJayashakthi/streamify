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
        className="pt-[64px] px-8 py-10 md:py-16 min-h-screen"
      >
        <div className="max-w-[2000px] mx-auto flex flex-col gap-y-10">
          <ContinueWatching />
          <VideoGrid />
        </div>
      </main>
    </>
  );
}
