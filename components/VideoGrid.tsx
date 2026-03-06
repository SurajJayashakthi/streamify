'use client';

import { useEffect, useState, useCallback } from 'react';
import { useVideoStore } from '@/store/useVideoStore';
import { getYouTubeVideos, YouTubeAPIError } from '@/lib/youtube';
import { YouTubeVideo } from '@/store/useVideoStore';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';
import ErrorBanner from './ErrorBanner';
import { Flame, Music2, TrendingUp } from 'lucide-react';

const SKELETON_COUNT = 12;

const categoryTags = [
    { label: 'All', query: 'music' },
    { label: '🔥 Trending', query: 'trending music 2024' },
    { label: '🎵 Lo-fi', query: 'lofi music chill beats' },
    { label: '🎸 Rock', query: 'rock music hits' },
    { label: '🎤 Hip-Hop', query: 'hip hop music' },
    { label: '🎻 Classical', query: 'classical music relaxing' },
    { label: '🎉 Pop', query: 'pop music 2024' },
    { label: '🕹️ Gaming', query: 'gaming music' },
];

export default function VideoGrid() {
    const { searchQuery, setSearchQuery } = useVideoStore();
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [activeTag, setActiveTag] = useState('All');

    const fetchVideos = useCallback(async (query: string) => {
        setLoading(true);
        setError(null);
        try {
            const results = await getYouTubeVideos(query);
            setVideos(results);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVideos(searchQuery);
    }, [searchQuery, fetchVideos]);

    const handleTagClick = (tag: { label: string; query: string }) => {
        setActiveTag(tag.label);
        setSearchQuery(tag.query);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #a855f7, #7c3aed)' }} />
                    <h1 className="text-xl font-bold text-white">
                        {searchQuery === 'lofi music chill beats' ? 'Discover Music' : `Results for "${searchQuery}"`}
                    </h1>
                </div>
                <p className="text-sm text-zinc-500 ml-3">
                    {loading ? 'Loading…' : `${videos.length} videos found`}
                </p>
            </div>

            {/* Category chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
                {categoryTags.map((tag) => (
                    <button
                        key={tag.label}
                        onClick={() => handleTagClick(tag)}
                        className="shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap"
                        style={{
                            background: activeTag === tag.label
                                ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                                : 'rgba(255,255,255,0.06)',
                            color: activeTag === tag.label ? '#fff' : '#a1a1aa',
                            border: activeTag === tag.label ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            boxShadow: activeTag === tag.label ? '0 2px 10px rgba(168,85,247,0.3)' : 'none'
                        }}
                    >
                        {tag.label}
                    </button>
                ))}
            </div>

            {/* Error state */}
            {error && !loading && (
                <ErrorBanner error={error} onRetry={() => fetchVideos(searchQuery)} />
            )}

            {/* Video grid */}
            {!error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10 mt-2">
                    {loading
                        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))
                        : videos.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && videos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-600">
                    <Music2 size={48} />
                    <p className="text-lg font-medium">No videos found</p>
                    <p className="text-sm">Try a different search term</p>
                </div>
            )}
        </div>
    );
}
