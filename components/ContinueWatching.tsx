'use client';

import { useEffect, useState } from 'react';
import { getContinueWatchingList, VideoProgress } from '@/lib/progress';
import { Play } from 'lucide-react';
import Image from 'next/image';
import { useVideoStore } from '@/store/useVideoStore';

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
        <div className="mb-8 sm:mb-10 w-full overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #a855f7, #7c3aed)' }} />
                Continue Watching
            </h2>

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
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_8px_30px_rgba(168,85,247,0.25)]">
                                <Image
                                    src={item.video.thumbnail}
                                    alt={item.video.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 260px, 280px"
                                />

                                {/* Overlay play button */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                                        style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                                        <Play className="text-white ml-1" size={20} fill="white" />
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
                                    <div
                                        className="h-full"
                                        style={{ width: `${percentage}%`, background: '#a855f7' }}
                                    />
                                </div>
                            </div>

                            <div className="mt-3 min-w-0 pr-2">
                                <h3 className="text-[13px] sm:text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
                                    {item.video.title}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-0.5 truncate">{item.video.channelTitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
