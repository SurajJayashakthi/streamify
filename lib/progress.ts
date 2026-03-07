import { YouTubeVideo } from '@/store/useVideoStore';

export interface VideoProgress {
    video: YouTubeVideo;
    timestamp: number;
    duration: number;
    lastAccessed: number;
}

const STORAGE_KEY = 'streamify_progress';
const COMPLETION_THRESHOLD = 10; // Consider finished if within 10 seconds of end

/**
 * Get all saved video progress from LocalStorage
 */
export function getAllVideoProgress(): Record<string, VideoProgress> {
    if (typeof window === 'undefined') return {};
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Failed to parse video progress from LocalStorage', error);
        return {};
    }
}

/**
 * Get progress for a specific video
 */
export function getVideoProgress(videoId: string): VideoProgress | null {
    const allProgress = getAllVideoProgress();
    return allProgress[videoId] || null;
}

/**
 * Save progress for a video.
 * Removes the progress if the video is considered "finished" (within COMPLETION_THRESHOLD).
 */
export function saveVideoProgress(video: YouTubeVideo, timestamp: number, duration: number) {
    if (typeof window === 'undefined') return;
    if (!video || !video.id) return;

    const allProgress = getAllVideoProgress();

    if (duration > 0 && duration - timestamp <= COMPLETION_THRESHOLD) {
        // Video is finished, clear from Continue Watching
        delete allProgress[video.id];
    } else {
        // Save progress
        allProgress[video.id] = {
            video,
            timestamp,
            duration,
            lastAccessed: Date.now(),
        };
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
    } catch (error) {
        console.error('Failed to save video progress to LocalStorage', error);
    }
}

/**
 * Remove progress for a specific video
 */
export function removeVideoProgress(videoId: string) {
    if (typeof window === 'undefined') return;
    const allProgress = getAllVideoProgress();
    if (allProgress[videoId]) {
        delete allProgress[videoId];
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
        } catch (error) {
            console.error('Failed to update video progress in LocalStorage', error);
        }
    }
}

/**
 * Get all videos in progress as an array, sorted by most recently accessed
 */
export function getContinueWatchingList(): VideoProgress[] {
    const allProgress = getAllVideoProgress();
    return Object.values(allProgress).sort((a, b) => b.lastAccessed - a.lastAccessed);
}
