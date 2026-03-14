'use client';

import Navbar from '@/components/Navbar';
import VideoGrid from '@/components/VideoGrid';
import ContinueWatching from '@/components/ContinueWatching';

export default function HomePage() {
  return (
    <>
      {/* Fixed top navbar */}
      <Navbar />

      {/* Main content without duplicate wrappers or padding since layout.tsx handles it */}
      <div className="flex flex-col gap-y-12">
        <ContinueWatching />
        <VideoGrid />
      </div>
    </>
  );
}
