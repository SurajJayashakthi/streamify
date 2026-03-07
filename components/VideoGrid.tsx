'use client';

import { useEffect, useState, useCallback } from 'react';
import { useVideoStore } from '@/store/useVideoStore';
import { getYouTubeVideos } from '@/lib/youtube';
import { YouTubeVideo } from '@/store/useVideoStore';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';
import ErrorBanner from './ErrorBanner';
import { Music2 } from 'lucide-react';

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
    const { searchQuery, setSearchQuery, favorites } = useVideoStore();
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [activeTag, setActiveTag] = useState('All');

    const fetchVideos = useCallback(async (query: string) => {
        setLoading(true);
        setError(null);

        if (query === '__FAVORITES__') {
            setVideos(favorites);
            setLoading(false);
            return;
        }

        try {
            const results = await getYouTubeVideos(query);
            setVideos(results);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [favorites]);

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
            <div className="flex flex-col gap-2 mb-4">
                <h1 className="text-[11px] font-black text-zinc-500 tracking-[0.3em] uppercase">
                    {searchQuery === 'lofi music chill beats'
                        ? 'Suggested'
                        : searchQuery === '__FAVORITES__'
                            ? 'Library'
                            : searchQuery}
                </h1>
                <p className="text-xs text-zinc-600 font-medium">
                    Curated selection for you.
                </p>
            </div>

            {/* Category Tags */}
            <div className="flex gap-2.5 overflow-x-auto pb-4 pt-4 no-scrollbar">
                {categoryTags.map((tag) => (
                    <button
                        key={tag.label}
                        onClick={() => handleTagClick(tag)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-500 whitespace-nowrap border ${activeTag === tag.label
                            ? 'bg-zinc-800 text-white border-zinc-700'
                            : 'bg-transparent text-zinc-600 border-zinc-900/50 hover:border-zinc-800 hover:text-zinc-400'
                            }`}
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
