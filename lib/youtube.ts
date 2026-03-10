import axios from 'axios';
import { YouTubeVideo } from '@/store/useVideoStore';

export interface YouTubeSearchResponse {
    videos: YouTubeVideo[];
    nextPageToken: string | null;
}

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export class YouTubeAPIError extends Error {
    constructor(
        message: string,
        public code: 'MISSING_KEY' | 'QUOTA_EXCEEDED' | 'RESTRICTED' | 'NETWORK' | 'UNKNOWN'
    ) {
        super(message);
        this.name = 'YouTubeAPIError';
    }
}

function getCacheKey(query: string): string {
    return `yt_cache_${query.toLowerCase().trim().replace(/\s+/g, '_')}`;
}

function getFromCache(query: string): YouTubeVideo[] | null {
    if (typeof window === 'undefined') return null;
    try {
        const cached = sessionStorage.getItem(getCacheKey(query));
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Cache valid for 10 minutes
            if (Date.now() - timestamp < 10 * 60 * 1000) return data;
        }
    } catch { }
    return null;
}

function setCache(query: string, data: YouTubeVideo[]): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(getCacheKey(query), JSON.stringify({ data, timestamp: Date.now() }));
    } catch { }
}

export async function getYouTubeVideos(query: string, maxResults = 20, pageToken?: string): Promise<YouTubeSearchResponse> {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    if (!apiKey || apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
        throw new YouTubeAPIError(
            'YouTube API key is missing. Please add NEXT_PUBLIC_YOUTUBE_API_KEY to your .env.local file.',
            'MISSING_KEY'
        );
    }

    // Return cached result if available (only for first page)
    if (!pageToken) {
        const cached = getFromCache(query);
        if (cached) return { videos: cached, nextPageToken: null };
    }

    try {
        // Step 1: Search for video IDs
        const searchResponse = await axios.get(`${BASE_URL}/search`, {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults,
                videoCategoryId: '10', // Music category
                key: apiKey,
                pageToken,
            },
        });

        const items = searchResponse.data.items;
        const nextPageToken = searchResponse.data.nextPageToken || null;
        if (!items || items.length === 0) return { videos: [], nextPageToken: null };

        const videoIds = items.map((item: any) => item.id.videoId).join(',');

        // Step 2: Fetch video statistics for view counts
        const statsResponse = await axios.get(`${BASE_URL}/videos`, {
            params: {
                part: 'statistics,contentDetails',
                id: videoIds,
                key: apiKey,
            },
        });

        const statsMap: Record<string, any> = {};
        statsResponse.data.items.forEach((item: any) => {
            statsMap[item.id] = item.statistics;
        });

        const videos: YouTubeVideo[] = items.map((item: any) => {
            const id = item.id.videoId;
            const stats = statsMap[id] || {};
            const viewCount = stats.viewCount
                ? parseInt(stats.viewCount).toLocaleString()
                : null;

            return {
                id,
                title: item.snippet.title,
                channelTitle: item.snippet.channelTitle,
                thumbnail:
                    item.snippet.thumbnails?.maxres?.url ||
                    item.snippet.thumbnails?.high?.url ||
                    item.snippet.thumbnails?.medium?.url,
                viewCount: viewCount ?? undefined,
                publishedAt: item.snippet.publishedAt,
                description: item.snippet.description,
            };
        });

        if (!pageToken) {
            setCache(query, videos);
        }
        return { videos, nextPageToken };
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const reason = error.response?.data?.error?.errors?.[0]?.reason;

            if (status === 403 && reason === 'quotaExceeded') {
                throw new YouTubeAPIError('YouTube API quota exceeded. Please try again tomorrow.', 'QUOTA_EXCEEDED');
            }
            if (status === 403) {
                throw new YouTubeAPIError('Access denied. Check your API key permissions.', 'RESTRICTED');
            }
            if (!error.response) {
                throw new YouTubeAPIError('Network error. Please check your connection.', 'NETWORK');
            }
        }
        throw new YouTubeAPIError('An unexpected error occurred.', 'UNKNOWN');
    }
}

export function formatViewCount(count?: string): string {
    if (!count) return '';
    const num = parseInt(count.replace(/,/g, ''));
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K views`;
    return `${count} views`;
}

export function formatPublishedAt(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'Today';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

export function getPersonalizedQuery(): string {
    if (typeof window === 'undefined') return 'Top Hits 2026';

    try {
        const favorites = JSON.parse(localStorage.getItem('streamify_favorites') || '[]');
        const continueWatching = JSON.parse(localStorage.getItem('streamify_continue_watching') || '[]');

        const allVideos = [...favorites, ...continueWatching];
        if (allVideos.length === 0) return 'Top Hits 2026';

        // Extract keywords from titles
        const keywords: Record<string, number> = {};
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'with', 'for', 'of', 'by', 'to', 'music', 'video', 'official', 'audio', 'lyrics', 'remix']);

        allVideos.forEach(v => {
            const words = v.title.toLowerCase().split(/[^a-z0-9]+/);
            words.forEach((word: string) => {
                if (word.length > 2 && !stopWords.has(word)) {
                    keywords[word] = (keywords[word] || 0) + 1;
                }
            });
        });

        const topKeywords = Object.entries(keywords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(e => e[0]);

        return topKeywords.length > 0 ? topKeywords.join(' ') : 'Top Hits 2026';
    } catch {
        return 'Top Hits 2026';
    }
}

export async function getRelatedVideos(videoId: string): Promise<YouTubeVideo[]> {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) return [];

    try {
        const response = await axios.get(`${BASE_URL}/search`, {
            params: {
                part: 'snippet',
                relatedToVideoId: videoId,
                type: 'video',
                maxResults: 10,
                key: apiKey,
            },
        });

        const items = response.data.items;
        if (!items) return [];

        return items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
            publishedAt: item.snippet.publishedAt,
        }));
    } catch {
        return [];
    }
}

export function decodeHtmlEntities(text: string): string {
    if (typeof window === 'undefined') return text;
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.documentElement.textContent || text;
}
