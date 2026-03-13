'use client';

import { useEffect, useState } from 'react';
import { getContinueWatchingList, VideoProgress } from '@/lib/progress';
import { Play } from 'lucide-react';
import Image from 'next/image';
import { useVideoStore } from '@/store/useVideoStore';
import { decodeHTML } from '@/lib/utils';

export default function ContinueWatching() {
    const [progressList, setProgressList] = useState<VideoProgress[]>([]);
    const { setActiveVideo } = useVideoStore();

    useEffect(() => {
        // Run only on client side
        const list = getContinueWatchingList();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgressList(list);

        // Optional: Listen to window focus or LocalStorage changes to refresh the list if needed
        const handleStorageChange = () => {
            setProgressList(getContinueWatchingList());
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleStorageChange);
        };
    }, []);

    if (progressList.length === 0) return null;

    return (
        <div className="mb-12 w-full overflow-hidden">
            <div className="flex flex-col gap-2 mb-8">
                <h2 className="text-sm font-bold text-zinc-600 tracking-widest uppercase">
                    Resume Playback
                </h2>
                <p className="text-2xl font-bold text-white tracking-tight">
                    Continue Watching
                </p>
            </div>

            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-none snap-x">
                {progressList.map((item) => {
                    const percentage = Math.min(100, Math.max(0, (item.timestamp / item.duration) * 100));

                    return (
                        <div
                            key={item.video.id}
                            className="flex-none w-[260px] sm:w-[280px] snap-start cursor-pointer group"
                            onClick={() => setActiveVideo(item.video)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setActiveVideo(item.video)}
                        >
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 transition-transform duration-500 group-hover:scale-[1.03]">
                                <Image
                                    src={item.video.thumbnail}
                                    alt={item.video.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 640px) 260px, 280px"
                                />

                                {/* Overlay play button */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10"
                                        style={{ background: 'rgba(255,255,255,0.1)' }}>
                                        <Play className="text-white ml-1" size={24} fill="white" />
                                    </div>
                                </div>

                                {/* Progress Bar (YouTube Red) */}
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
                                    <div
                                        className="h-full bg-red-600"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 min-w-0 pr-2">
                                <h3 className="text-base font-semibold text-white leading-tight tracking-tight line-clamp-2 group-hover:text-red-500 transition-colors">
                                    {decodeHTML(item.video.title)}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1 font-medium">{item.video.channelTitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
