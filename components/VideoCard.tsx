'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Play, MoreVertical, Clock } from 'lucide-react';
import { YouTubeVideo } from '@/store/useVideoStore';
import { useVideoStore } from '@/store/useVideoStore';
import { formatViewCount, formatPublishedAt } from '@/lib/youtube';
import { decodeHTML } from '@/lib/utils';
import { Heart, User } from 'lucide-react';
import { getVideoProgress } from '@/lib/progress';

interface VideoCardProps {
    video: YouTubeVideo;
}

// Channel initial avatar
function ChannelAvatar({ name }: { name: string }) {
    const colors = ['#a855f7', '#7c3aed', '#ec4899', '#3b82f6', '#10b981'];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: color }}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

export default function VideoCard({ video }: VideoCardProps) {
    const { setActiveVideo, favorites, toggleFavorite } = useVideoStore();
    const [imgError, setImgError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const isFavorite = favorites.some((v) => v.id === video.id);
    const progress = getVideoProgress(video.id);
    const progressPercent = progress && progress.duration > 0
        ? (progress.timestamp / progress.duration) * 100
        : 0;

    const thumbnailSrc = imgError
        ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
        : video.thumbnail;

    const decodedTitle = decodeHTML(video.title);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent playing the video when clicking heart
        toggleFavorite(video);
    };

    return (
        <article
            className="flex flex-col gap-3 cursor-pointer group"
            onClick={() => setActiveVideo(video)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Thumbnail Container */}
            <div
                className="relative aspect-video w-full overflow-hidden rounded-2xl cursor-pointer"
                onClick={() => setActiveVideo(video)}
            >
                <Image
                    src={thumbnailSrc}
                    alt={decodedTitle}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={() => setImgError(true)}
                />

                {/* Overlay on hover */}
                <div
                    className="absolute inset-0 flex items-center justify-center transition-all duration-500"
                    style={{
                        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))',
                        opacity: isHovered ? 1 : 0,
                    }}
                >
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md"
                        style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            transform: isHovered ? 'scale(1)' : 'scale(0.8)',
                            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        }}
                    >
                        <Play className="text-white ml-0.5" size={20} fill="white" />
                    </div>
                </div>

                {/* Favorite Heart Button */}
                <button
                    onClick={handleFavoriteClick}
                    className="absolute top-3 right-3 p-2 rounded-full transition-all duration-300 backdrop-blur-xl"
                    style={{
                        background: isFavorite ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        opacity: isFavorite || isHovered ? 1 : 0
                    }}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Heart size={14} fill={isFavorite ? '#6366f1' : 'transparent'} className={isFavorite ? 'text-indigo-400 scale-110' : 'text-white'} strokeWidth={isFavorite ? 2.5 : 1.5} />
                </button>

                {/* Duration badge */}
                <div className="absolute bottom-3 right-3 px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-white/90 backdrop-blur-md border border-white/10"
                    style={{ background: 'rgba(9, 9, 11, 0.6)' }}>
                    14:02
                </div>

                {/* Progress Bar (1px Thin Red) */}
                {progressPercent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10">
                        <div
                            className="h-full bg-[#FF0000]"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Content info */}
            <div className="flex gap-3 px-1">
                <div className="hidden sm:block w-8 h-8 rounded-full bg-zinc-800 shrink-0 overflow-hidden border border-white/5">
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                        <User size={14} className="text-zinc-500" />
                    </div>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h3
                        className="text-[13px] font-medium text-white/90 leading-snug line-clamp-2 hover:text-red-500 transition-colors cursor-pointer"
                        title={decodedTitle}
                        onClick={() => setActiveVideo(video)}
                    >
                        {decodedTitle}
                    </h3>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-zinc-500 text-[11px] font-medium hover:text-zinc-300 transition-colors cursor-pointer w-fit">{video.channelTitle}</p>
                        <p className="text-zinc-600 text-xs">
                            {formatViewCount(video.viewCount)} • {formatPublishedAt(video.publishedAt)}
                        </p>
                    </div>
                </div>
                <button
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="More options"
                >
                    <MoreVertical size={16} />
                </button>
            </div>
        </article>
    );
}
