'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useVideoStore } from '@/store/useVideoStore';
import { getYouTubeVideos, getPersonalizedQuery, getTrendingVideos } from '@/lib/youtube';
import { YouTubeVideo } from '@/store/useVideoStore';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';
import ErrorBanner from './ErrorBanner';
import { Music2, Sparkles, TrendingUp } from 'lucide-react';

const SKELETON_COUNT = 12;

// ── Category pills ────────────────────────────────────────────────────────────
const categoryTags = [
    { label: 'For You',    query: '__HOME__',                   icon: '✦' },
    { label: 'Trending',   query: 'trending music 2026',        icon: '🔥' },
    { label: 'Lo-fi',      query: 'lofi chill beats study',     icon: '☁️' },
    { label: 'Hip-Hop',    query: 'hip hop rap 2026',           icon: '🎤' },
    { label: 'Pop',        query: 'pop music hits 2026',        icon: '⚡' },
    { label: 'Rock',       query: 'rock music hits',            icon: '🎸' },
    { label: 'Classical',  query: 'classical music relaxing',   icon: '🎻' },
    { label: 'Electronic', query: 'electronic dance music EDM', icon: '🎛️' },
    { label: 'R&B',        query: 'rnb soul music 2026',        icon: '🌙' },
    { label: 'Gaming',     query: 'gaming music epic',          icon: '🕹️' },
];

// ── Section divider shown between personalized + trending chunks ──────────────
function SectionDivider({ label, icon }: { label: string; icon: React.ReactNode }) {
    return (
        <div className="col-span-full flex items-center gap-4 py-2">
            <div className="flex items-center gap-2 shrink-0">
                {icon}
                <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.25em]">{label}</span>
            </div>
            <div className="flex-1 h-px bg-white/[0.04]" />
        </div>
    );
}

export default function VideoGrid() {
    const {
        searchQuery, setSearchQuery,
        favorites,
        nextPageToken, setNextPageToken,
    } = useVideoStore();

    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [trendingVideos, setTrendingVideos] = useState<YouTubeVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [activeTag, setActiveTag] = useState('For You');
    const [personalizedQuery, setPersonalizedQuery] = useState('');
    const observerRef = useRef<IntersectionObserver | null>(null);

    // ── Resolve the real query for the current searchQuery sentinel ────────────
    const resolveQuery = useCallback((q: string): string => {
        if (q === '__HOME__') return getPersonalizedQuery();
        return q;
    }, []);

    // ── Initial load: personalized videos + trending diversification ───────────
    const fetchInitial = useCallback(async () => {
        setLoading(true);
        setError(null);
        setVideos([]);
        setTrendingVideos([]);
        setNextPageToken(null);

        if (searchQuery === '__FAVORITES__') {
            setVideos(favorites);
            setLoading(false);
            return;
        }

        const query = resolveQuery(searchQuery);
        setPersonalizedQuery(query);

        try {
            // Fetch personalized results + trending in parallel for speed
            const [personalizedResult, trending] = await Promise.allSettled([
                getYouTubeVideos(query, 16),
                searchQuery === '__HOME__' ? getTrendingVideos(8) : Promise.resolve([]),
            ]);

            const personalized =
                personalizedResult.status === 'fulfilled' ? personalizedResult.value.videos : [];
            const trendingResult =
                trending.status === 'fulfilled' ? trending.value : [];

            const token =
                personalizedResult.status === 'fulfilled'
                    ? personalizedResult.value.nextPageToken
                    : null;

            // Deduplicate trending against personalized results
            const personalizedIds = new Set(personalized.map(v => v.id));
            const dedupedTrending = trendingResult.filter(v => !personalizedIds.has(v.id));

            setVideos(personalized);
            setTrendingVideos(dedupedTrending);
            setNextPageToken(token);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [searchQuery, favorites, resolveQuery, setNextPageToken]);

    // ── Load more (infinite scroll) ────────────────────────────────────────────
    const fetchMore = useCallback(async () => {
        if (!nextPageToken || loadingMore) return;
        setLoadingMore(true);

        const query = resolveQuery(searchQuery);
        try {
            const { videos: newVideos, nextPageToken: newToken } = await getYouTubeVideos(
                query, 20, nextPageToken
            );
            setVideos(prev => [...prev, ...newVideos]);
            setNextPageToken(newToken);
        } catch {
            // silently fail on load-more; don't replace the whole feed with an error
        } finally {
            setLoadingMore(false);
        }
    }, [nextPageToken, loadingMore, searchQuery, resolveQuery, setNextPageToken]);

    // ── Trigger initial fetch when query changes ───────────────────────────────
    useEffect(() => {
        fetchInitial();
    }, [fetchInitial]);

    // ── IntersectionObserver — sentinel on last video card ────────────────────
    const lastCardRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (loading || loadingMore) return;
            if (observerRef.current) observerRef.current.disconnect();

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && nextPageToken) fetchMore();
                },
                { rootMargin: '400px' }       // start loading 400px before reaching the sentinel
            );

            if (node) observerRef.current.observe(node);
        },
        [loading, loadingMore, nextPageToken, fetchMore]
    );

    // ── Category pill click ────────────────────────────────────────────────────
    const handleTagClick = (tag: typeof categoryTags[number]) => {
        setActiveTag(tag.label);
        setSearchQuery(tag.query);
    };

    // ── Heading derivation ─────────────────────────────────────────────────────
    const getHeading = () => {
        if (searchQuery === '__HOME__') return { eyebrow: 'Picked for you', title: 'Your Daily Mix' };
        if (searchQuery === '__FAVORITES__') return { eyebrow: 'Saved tracks', title: 'Your Library' };
        const tag = categoryTags.find(t => t.query === searchQuery);
        return {
            eyebrow: 'Exploring',
            title: tag ? `${tag.icon} ${tag.label}` : searchQuery,
        };
    };

    const { eyebrow, title } = getHeading();
    const showTrending = searchQuery === '__HOME__' && trendingVideos.length > 0 && !loading;
    const allVideos = videos;   // trending rendered separately via divider

    return (
        <div className="flex flex-col gap-6">

            {/* ── Section heading ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-center gap-2">
                    {searchQuery === '__HOME__'
                        ? <Sparkles size={14} className="text-[#8b5cf6]" strokeWidth={2} />
                        : <Music2 size={14} className="text-zinc-500" strokeWidth={2} />
                    }
                    <p className="text-xs font-bold text-zinc-500 tracking-[0.2em] uppercase">{eyebrow}</p>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                    {loading && searchQuery === '__HOME__' ? 'Loading your mix…' : title}
                </h1>
                {searchQuery === '__HOME__' && personalizedQuery && !loading && (
                    <p className="text-xs text-zinc-600 mt-1">
                        Based on&nbsp;
                        <span className="text-zinc-400 font-semibold">{personalizedQuery}</span>
                    </p>
                )}
            </div>

            {/* ── Category pills ─────────────────────────────────────────────── */}
            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
                {categoryTags.map((tag) => (
                    <button
                        key={tag.label}
                        onClick={() => handleTagClick(tag)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all duration-300 whitespace-nowrap border flex items-center gap-1.5 ${
                            activeTag === tag.label
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                : 'bg-zinc-900/30 text-zinc-500 hover:text-white border-zinc-800/50 hover:border-zinc-700'
                        }`}
                    >
                        <span>{tag.icon}</span>
                        {tag.label}
                    </button>
                ))}
            </div>

            {/* ── Error banner ───────────────────────────────────────────────── */}
            {error && !loading && (
                <ErrorBanner error={error} onRetry={fetchInitial} />
            )}

            {/* ── Video grid ─────────────────────────────────────────────────── */}
            {!error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10 mt-2">
                    {/* Initial skeleton */}
                    {loading && Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <SkeletonCard key={`sk-${i}`} />
                    ))}

                    {/* Personalized / queried videos */}
                    {!loading && allVideos.map((video, index) => {
                        const isLast = index === allVideos.length - 1 && !showTrending;
                        return (
                            <div key={`feed-${video.id}-${index}`} ref={isLast ? lastCardRef : undefined}>
                                <VideoCard video={video} />
                            </div>
                        );
                    })}

                    {/* ── Trending diversification section ─────────────────── */}
                    {showTrending && (
                        <>
                            <SectionDivider
                                label="Trending Now"
                                icon={<TrendingUp size={14} className="text-[#8b5cf6]" strokeWidth={2.5} />}
                            />
                            {trendingVideos.map((video, index) => {
                                const isLast = index === trendingVideos.length - 1;
                                return (
                                    <div key={`trend-${video.id}-${index}`} ref={isLast ? lastCardRef : undefined}>
                                        <VideoCard video={video} />
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* Load-more skeletons */}
                    {loadingMore && Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={`lm-${i}`} />
                    ))}
                </div>
            )}

            {/* ── Empty state ────────────────────────────────────────────────── */}
            {!loading && !error && videos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                        <Music2 size={28} strokeWidth={1.5} />
                    </div>
                    <p className="text-base font-bold text-zinc-500">No videos found</p>
                    <p className="text-sm text-zinc-700">Try a different search or category</p>
                </div>
            )}

            {/* ── End of feed indicator ──────────────────────────────────────── */}
            {!loading && !loadingMore && !nextPageToken && videos.length > 0 && (
                <div className="flex flex-col items-center py-12 gap-2">
                    <div className="w-8 h-0.5 rounded-full bg-zinc-800 mb-2" />
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">You&apos;re all caught up</p>
                    <p className="text-[11px] text-zinc-700">Change category to explore more</p>
                </div>
            )}
        </div>
    );
}
