'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Play, MoreVertical } from 'lucide-react';
import { YouTubeVideo, useVideoStore } from '@/store/useVideoStore';
import { formatViewCount, formatPublishedAt } from '@/lib/youtube';
import { decodeHTML } from '@/lib/utils';
import { Heart, User } from 'lucide-react';
import { getVideoProgress } from '@/lib/progress';

interface VideoCardProps {
    video: YouTubeVideo;
}

export default function VideoCard({ video }: VideoCardProps) {
    const { setActiveVideo, favorites, toggleFavorite } = useVideoStore();
    const [isHovered, setIsHovered] = useState(false);
    const progress = getVideoProgress(video.id);

    const isFavorite = favorites.some((v) => v.id === video.id);

    return (
        <div
            className="group relative flex flex-col gap-4 cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setActiveVideo(video)}
        >
            {/* Thumbnail Container */}
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl transition-all duration-700 group-hover:scale-[1.02] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] group-hover:border-white/10">
                <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className={`object-cover transition-all duration-1000 ${isHovered ? 'scale-110 blur-[2px] opacity-60' : 'scale-100 blur-0 opacity-100'}`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Progress Bar (OLED Style) */}
                {progress && progress.percent > 0 && (
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/10 overflow-hidden">
                        <div
                            className="h-full bg-red-600 transition-all duration-300"
                            style={{ width: `${progress.percent}%` }}
                        />
                    </div>
                )}

                {/* Hover Play State */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-500">
                        <Play size={32} fill="white" className="text-white ml-1" />
                    </div>
                </div>

                {/* Duration Badge */}
                {video.duration && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/5 text-[10px] font-black text-white uppercase tracking-widest">
                        {video.duration}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="flex gap-4 px-1">
                <div className="shrink-0 pt-1">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 overflow-hidden">
                        <User size={20} strokeWidth={1.5} />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-[#8b5cf6] transition-colors duration-300 tracking-tight">
                        {decodeHTML(video.title)}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 group-hover:gap-3 transition-all">
                        <p className="text-[11px] font-semibold text-zinc-500 truncate hover:text-zinc-300 transition-colors">
                            {video.channelTitle}
                        </p>
                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">
                            {formatPublishedAt(video.publishedAt)}
                        </p>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">
                            {formatViewCount(video.viewCount)}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(video);
                        }}
                        className={`p-2 rounded-full hover:bg-white/10 transition-all ${isFavorite ? 'text-red-500' : 'text-zinc-500'}`}
                    >
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
                    </button>
                    <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-full hover:bg-white/10 transition-all text-zinc-500"
                    >
                        <MoreVertical size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
}
