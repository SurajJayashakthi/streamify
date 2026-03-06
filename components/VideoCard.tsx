'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Play, MoreVertical, Clock } from 'lucide-react';
import { YouTubeVideo } from '@/store/useVideoStore';
import { useVideoStore } from '@/store/useVideoStore';
import { formatViewCount, formatPublishedAt } from '@/lib/youtube';

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
    const { setActiveVideo } = useVideoStore();
    const [imgError, setImgError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const thumbnailSrc = imgError
        ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
        : video.thumbnail;

    return (
        <article
            className="flex flex-col gap-3 cursor-pointer group"
            onClick={() => setActiveVideo(video)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActiveVideo(video)}
            aria-label={`Play ${video.title}`}
        >
            {/* Thumbnail */}
            <div
                className="relative w-full aspect-video rounded-xl overflow-hidden"
                style={{
                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    boxShadow: isHovered ? '0 0 0 2px #a855f7, 0 8px 30px rgba(168,85,247,0.25)' : 'none',
                }}
            >
                <Image
                    src={thumbnailSrc}
                    alt={video.title}
                    fill
                    className="object-cover"
                    onError={() => setImgError(true)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />

                {/* Overlay on hover */}
                <div
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                    style={{
                        background: 'rgba(0,0,0,0.45)',
                        opacity: isHovered ? 1 : 0,
                    }}
                >
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                            boxShadow: '0 0 20px rgba(168,85,247,0.6)',
                            transform: isHovered ? 'scale(1)' : 'scale(0.7)',
                            transition: 'transform 0.2s ease',
                        }}
                    >
                        <Play className="text-white ml-0.5" size={20} fill="white" />
                    </div>
                </div>

                {/* Duration badge placeholder */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                    style={{ background: 'rgba(0,0,0,0.75)' }}>
                    <Clock size={10} />
                    <span>4:20</span>
                </div>
            </div>

            {/* Metadata row */}
            <div className="flex gap-3">
                <ChannelAvatar name={video.channelTitle} />
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <h3
                        className="text-[13px] sm:text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors"
                        title={video.title}
                    >
                        {video.title}
                    </h3>
                    <p className="text-xs text-zinc-500 truncate">{video.channelTitle}</p>
                    <p className="text-xs text-zinc-600">
                        {video.viewCount ? formatViewCount(video.viewCount) : ''}
                        {video.viewCount && video.publishedAt ? ' • ' : ''}
                        {video.publishedAt ? formatPublishedAt(video.publishedAt) : ''}
                    </p>
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
