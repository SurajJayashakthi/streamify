'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useVideoStore } from '@/store/useVideoStore';
import { getYouTubeVideos, getPersonalizedQuery } from '@/lib/youtube';
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
    const { searchQuery, setSearchQuery, favorites, nextPageToken, setNextPageToken } = useVideoStore();
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [activeTag, setActiveTag] = useState('All');
    const observer = useRef<IntersectionObserver | null>(null);

    const fetchVideos = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        setError(null);

        if (searchQuery === '__FAVORITES__') {
            setVideos(favorites);
            setLoading(false);
            setLoadingMore(false);
            return;
        }

        // Use personalized query for initial load if search is default
        const finalQuery = (isInitial && searchQuery === 'lofi music chill beats') ? getPersonalizedQuery() : searchQuery;

        try {
            const { videos: newVideos, nextPageToken: newToken } = await getYouTubeVideos(
                finalQuery,
                20,
                isInitial ? undefined : nextPageToken ?? undefined
            );

            if (isInitial) {
                setVideos(newVideos);
            } else {
                setVideos(prev => [...prev, ...newVideos]);
            }
            setNextPageToken(newToken);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [favorites, nextPageToken, setNextPageToken, searchQuery]);

    // Initial fetch
    useEffect(() => {
        fetchVideos(true);
    }, [fetchVideos]);

    const lastVideoRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPageToken && searchQuery !== '__FAVORITES__') {
                fetchVideos(false);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, nextPageToken, searchQuery, fetchVideos]);

    const handleTagClick = (tag: { label: string; query: string }) => {
        setActiveTag(tag.label);
        setSearchQuery(tag.query);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-6">
                <h1 className="text-sm font-bold text-zinc-600 tracking-widest uppercase">
                    {searchQuery === 'lofi music chill beats'
                        ? 'Suggested For You'
                        : searchQuery === '__FAVORITES__'
                            ? 'Your Library'
                            : searchQuery}
                </h1>
                <p className="text-2xl font-bold text-white tracking-tight">
                    Curated selection.
                </p>
            </div>

            {/* Category Tags */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-4 no-scrollbar">
                {categoryTags.map((tag) => (
                    <button
                        key={tag.label}
                        onClick={() => handleTagClick(tag)}
                        className={`px-8 py-3 rounded-xl text-xs font-bold tracking-tight transition-all duration-500 whitespace-nowrap border ${activeTag === tag.label
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900/30 text-zinc-500 hover:text-white border-zinc-800/50'
                            }`}
                    >
                        {tag.label}
                    </button>
                ))}
            </div>

            {/* Error state */}
            {error && !loading && (
                <ErrorBanner error={error} onRetry={() => fetchVideos(true)} />
            )}

            {/* Video grid */}
            {!error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mt-6">
                    {loading
                        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                            <SkeletonCard key={`initial-${i}`} />
                        ))
                        : videos.map((video, index) => {
                            if (videos.length === index + 1) {
                                return (
                                    <div ref={lastVideoRef} key={video.id}>
                                        <VideoCard video={video} />
                                    </div>
                                );
                            } else {
                                return <VideoCard key={video.id} video={video} />;
                            }
                        })}
                    {loadingMore && Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={`more-${i}`} />
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
