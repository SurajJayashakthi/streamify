'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
    Play, Pause, SkipBack, SkipForward,
    Volume2, X, ChevronDown, FileText
} from 'lucide-react';
import { useVideoStore, YouTubeVideo } from '@/store/useVideoStore';
import { saveVideoProgress, getVideoProgress } from '@/lib/progress';
import { decodeHTML } from '@/lib/utils';
import { getRelatedVideos } from '@/lib/youtube';

const YouTube = dynamic(() => import('react-youtube'), { ssr: false });

// ─── Skeleton card for loading state ─────────────────────────────────────────
function QueueSkeleton() {
    return (
        <div className="flex items-center gap-5 p-4 rounded-3xl bg-white/[0.02] border border-white/[0.03] animate-pulse">
            <div className="w-28 aspect-video rounded-xl bg-zinc-800/60 shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 rounded-full bg-zinc-800/60 w-4/5" />
                <div className="h-2 rounded-full bg-zinc-800/40 w-2/5" />
            </div>
        </div>
    );
}

export default function CustomPlayer() {
    const {
        activeVideo,
        setActiveVideo,
        isPlayerOpen,
        setIsPlayerOpen,
        isMinimized,
        setIsMinimized,
        autoPlay,
        setAutoPlay,
        playHistory,
        popHistory,
    } = useVideoStore();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [showVolume, setShowVolume] = useState(false);
    const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
    const [relatedLoading, setRelatedLoading] = useState(false);

    // ── Countdown: null = not counting, 3/2/1 = seconds remaining ────────────
    const [countdown, setCountdown] = useState<number | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);

    // ─── 1. Silent audio loop (keeps OS audio focus while screen is off) ───────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const audio = new Audio('/silence.mp3');
        audio.loop = true;
        audio.volume = 0.001;
        silentAudioRef.current = audio;
        return () => { audio.pause(); silentAudioRef.current = null; };
    }, []);

    // ─── 2. Countdown helpers ─────────────────────────────────────────────────
    const clearCountdown = useCallback(() => {
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
        setCountdown(null);
    }, []);

    const cancelAutoPlay = useCallback(() => {
        clearCountdown();
    }, [clearCountdown]);

    // ─── 3. Play next track ───────────────────────────────────────────────────
    const handleNext = useCallback(() => {
        clearCountdown();
        const nextVideo = relatedVideos[0];
        if (nextVideo) {
            setActiveVideo(nextVideo);
            setTimeout(() => {
                if (playerRef.current) {
                    playerRef.current.loadVideoById(nextVideo.id);
                    playerRef.current.playVideo();
                }
            }, 50);
        } else {
            setIsPlaying(false);
            playerRef.current?.pauseVideo();
        }
    }, [relatedVideos, setActiveVideo, clearCountdown]);

    const handlePrevious = useCallback(() => {
        if (currentTime > 5 && playerRef.current) {
            // If more than 5 seconds in, restart current track
            playerRef.current.seekTo(0, true);
        } else if (playHistory.length > 0) {
            // Otherwise go back to previous track
            popHistory();
            // Store's activeVideo handles the load asynchronously
        } else if (playerRef.current) {
            // Fallback: just restart if no history
            playerRef.current.seekTo(0, true);
        }
    }, [currentTime, playHistory.length, popHistory]);

    // ─── 4. Start 3-second countdown, then auto-advance ──────────────────────
    const startCountdown = useCallback(() => {
        if (!autoPlay || relatedVideos.length === 0) return;
        setCountdown(3);
        let remaining = 3;
        countdownTimerRef.current = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(countdownTimerRef.current!);
                countdownTimerRef.current = null;
                handleNext();
            } else {
                setCountdown(remaining);
            }
        }, 1000);
    }, [autoPlay, relatedVideos, handleNext]);

    // ─── 5. Player ready ──────────────────────────────────────────────────────
    const onReady = useCallback((event: { target: any }) => {
        playerRef.current = event.target;
        setDuration(event.target.getDuration());

        if (activeVideo) {
            setRelatedLoading(true);
            getRelatedVideos(activeVideo.id).then((vids) => {
                setRelatedVideos(vids);
                setRelatedLoading(false);
            });
            const saved = getVideoProgress(activeVideo.id);
            if (saved && saved.timestamp > 0) event.target.seekTo(saved.timestamp, true);
        }
        event.target.playVideo();
    }, [activeVideo]);

    // ─── 6. State change ──────────────────────────────────────────────────────
    const onStateChange = useCallback((event: { data: number }) => {
        const state = event.data;
        setIsPlaying(state === 1);

        if (state === 0) { // ENDED
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
            silentAudioRef.current?.pause();
            startCountdown(); // kick off 3-second countdown (noop if autoPlay off)

        } else if (state === 1) { // PLAYING
            clearCountdown(); // cancel any pending countdown if user re-plays
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            silentAudioRef.current?.play().catch(() => { });

            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = setInterval(() => {
                if (playerRef.current) {
                    const ct = playerRef.current.getCurrentTime();
                    setCurrentTime(ct);
                    if ('mediaSession' in navigator && duration > 0) {
                        try {
                            navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: ct });
                        } catch { /* ignore */ }
                    }
                }
            }, 500);

        } else if (state === 2) { // PAUSED
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            silentAudioRef.current?.pause();
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
    }, [duration, startCountdown, clearCountdown]);

    // ─── 7. Toggle play ───────────────────────────────────────────────────────
    const togglePlay = useCallback(() => {
        if (!playerRef.current) return;
        isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
    }, [isPlaying]);

    // ─── 8. Seek ──────────────────────────────────────────────────────────────
    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!playerRef.current || duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newTime = percent * duration;
        setCurrentTime(newTime);
        playerRef.current.seekTo(newTime, true);
    }, [duration]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
    };

    // ─── 9. Persist progress ──────────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && activeVideo && isPlaying) {
                saveVideoProgress(activeVideo, playerRef.current.getCurrentTime(), playerRef.current.getDuration());
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [activeVideo, isPlaying]);

    // ─── 10. Popstate — minimize instead of navigate away ────────────────────
    useEffect(() => {
        if (!isPlayerOpen) return;
        if (!isMinimized) window.history.pushState({ streamifyPlayer: true }, '');
        const handlePopState = () => {
            setIsMinimized(true);
            if (isPlayerOpen) window.history.pushState({ streamifyPlayer: true }, '');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isPlayerOpen, isMinimized, setIsMinimized]);

    // ─── 11. Media Session API ────────────────────────────────────────────────
    useEffect(() => {
        if (!('mediaSession' in navigator) || !activeVideo) return;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: decodeHTML(activeVideo.title),
            artist: activeVideo.channelTitle,
            album: 'Streamify',
            artwork: [
                { src: activeVideo.thumbnail, sizes: '128x128', type: 'image/jpeg' },
                { src: activeVideo.thumbnail, sizes: '256x256', type: 'image/jpeg' },
                { src: activeVideo.thumbnail, sizes: '512x512', type: 'image/jpeg' },
            ],
        });
        navigator.mediaSession.setActionHandler('play', () => playerRef.current?.playVideo());
        navigator.mediaSession.setActionHandler('pause', () => playerRef.current?.pauseVideo());
        navigator.mediaSession.setActionHandler('stop', () => playerRef.current?.pauseVideo());
        navigator.mediaSession.setActionHandler('nexttrack', handleNext);
        navigator.mediaSession.setActionHandler('previoustrack', handlePrevious);
        navigator.mediaSession.setActionHandler('seekto', (d) => {
            if (d.seekTime !== undefined && playerRef.current) {
                playerRef.current.seekTo(d.seekTime, true);
                setCurrentTime(d.seekTime);
            }
        });
        return () => {
            (['play', 'pause', 'stop', 'nexttrack', 'previoustrack', 'seekto'] as MediaSessionAction[])
                .forEach(action => { try { navigator.mediaSession.setActionHandler(action, null); } catch { /* ignore */ } });
        };
    }, [activeVideo, handleNext, handlePrevious]);

    // ─── 12. Reset state when active video changes ────────────────────────────
    useEffect(() => {
        clearCountdown();
        setCurrentTime(0);
        setDuration(0);
    }, [activeVideo?.id, clearCountdown]);

    // ─── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            clearCountdown();
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [clearCountdown]);

    // Pause when closed but do NOT unmount
    useEffect(() => {
        if (!isPlayerOpen && playerRef.current) {
            playerRef.current.pauseVideo();
        }
    }, [isPlayerOpen]);

    if (!activeVideo) return null;

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1 as 0 | 1,
            controls: 0 as 0 | 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1 as 0 | 1,
            enablejsapi: 1 as 0 | 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
    };

    const nextVideo = relatedVideos[0] ?? null;
    const progressPct = (currentTime / (duration || 1)) * 100;

    return (
        <div className={`fixed inset-0 z-[100] ${isPlayerOpen ? 'pointer-events-none' : 'opacity-0 pointer-events-none invisible w-0 h-0 overflow-hidden'}`}>
            <div
                className={`absolute inset-0 bg-black flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto h-[100dvh] overflow-hidden ${isMinimized ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'}`}
            >
                {/* ── Header ────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.03] bg-black shrink-0">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-3 rounded-full bg-white/5 text-zinc-400 hover:text-white transition-all hover:bg-white/10"
                        aria-label="Minimize player"
                    >
                        <ChevronDown size={28} strokeWidth={1.5} />
                    </button>
                    <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Auto-Play</p>
                        <button
                            onClick={() => { setAutoPlay(!autoPlay); if (!autoPlay === false) clearCountdown(); }}
                            className={`w-11 h-6 rounded-full relative transition-all duration-500 ${autoPlay ? 'bg-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-zinc-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-sm ${autoPlay ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* ── Scrollable content ────────────────────────────────────── */}
                <div className="flex-1 flex flex-col items-center px-8 lg:px-12 max-w-4xl mx-auto w-full overflow-y-auto no-scrollbar py-6">

                    {/* Video Player + Countdown Overlay */}
                    <div className="w-full max-h-[60vh] aspect-video rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 bg-zinc-900 relative group/player">
                        <YouTube
                            videoId={activeVideo.id}
                            opts={opts}
                            onReady={onReady}
                            onStateChange={onStateChange}
                            className="w-full h-full"
                        />

                        {/* ── 3-second countdown overlay ─────────────────────── */}
                        {countdown !== null && nextVideo && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-[2.5rem] z-10 animate-in fade-in duration-300">
                                {/* Next track thumbnail preview */}
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#8b5cf6] shadow-[0_0_30px_rgba(139,92,246,0.5)] mb-4">
                                    <Image src={nextVideo.thumbnail} alt={nextVideo.title} fill className="object-cover" />
                                </div>

                                <p className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-[0.3em] mb-1">Up Next</p>
                                <p className="text-sm font-bold text-white text-center px-8 line-clamp-1 mb-5">
                                    {decodeHTML(nextVideo.title)}
                                </p>

                                {/* Countdown ring + number */}
                                <div className="relative w-20 h-20 flex items-center justify-center mb-5">
                                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                                        <circle
                                            cx="40" cy="40" r="36" fill="none"
                                            stroke="#8b5cf6" strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 36}`}
                                            strokeDashoffset={`${2 * Math.PI * 36 * (countdown / 3)}`}
                                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                                        />
                                    </svg>
                                    <span className="text-4xl font-black text-white tabular-nums">{countdown}</span>
                                </div>

                                <button
                                    onClick={cancelAutoPlay}
                                    className="px-6 py-2.5 rounded-full border border-white/20 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-all tracking-widest uppercase"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Song info */}
                    <div className="w-full mt-10 text-center flex flex-col items-center gap-3">
                        <h2 className="text-2xl font-black text-white px-4 leading-tight tracking-tight">
                            {decodeHTML(activeVideo.title)}
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[#8b5cf6] tracking-wide uppercase">{activeVideo.channelTitle}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                            <span className="text-sm font-bold text-zinc-500">Official Stream</span>
                        </div>
                    </div>

                    {/* ── Up Next Queue ─────────────────────────────────────── */}
                    <div className="w-full mt-14 max-w-2xl">
                        {/* Queue header with inline auto-play toggle */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.25em]">Up Next</h3>
                                {relatedLoading && (
                                    <div className="w-3 h-3 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
                                )}
                            </div>
                            {/* Inline auto-play toggle (contextual, near the queue) */}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Auto-play</span>
                                <button
                                    onClick={() => { setAutoPlay(!autoPlay); if (!autoPlay === false) clearCountdown(); }}
                                    className={`w-10 h-5 rounded-full relative transition-all duration-500 ${autoPlay ? 'bg-[#8b5cf6]/80' : 'bg-zinc-700/60'}`}
                                    aria-label="Toggle autoplay"
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-sm ${autoPlay ? 'left-5' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Skeleton while loading */}
                            {relatedLoading && Array.from({ length: 4 }).map((_, i) => <QueueSkeleton key={i} />)}

                            {/* Loaded: first card is the "auto-next" candidate → special styling */}
                            {!relatedLoading && relatedVideos.slice(0, 6).map((v, i) => {
                                const isNext = i === 0;
                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => { clearCountdown(); setActiveVideo(v); }}
                                        className={`flex items-center gap-5 p-4 rounded-3xl border transition-all group/item text-left ${isNext
                                            ? 'bg-white/[0.04] border-[#8b5cf6]/30 hover:border-[#8b5cf6]/60 hover:bg-white/[0.07] shadow-[0_0_30px_rgba(139,92,246,0.08)]'
                                            : 'bg-white/[0.02] border-white/[0.03] hover:bg-white/[0.06] hover:border-white/10'
                                            }`}
                                    >
                                        {/* Thumbnail */}
                                        <div className={`relative w-28 aspect-video rounded-xl overflow-hidden shrink-0 ${isNext ? 'ring-1 ring-[#8b5cf6]/50' : ''}`}>
                                            <Image
                                                src={v.thumbnail}
                                                alt={v.title}
                                                fill
                                                className="object-cover group-hover/item:scale-110 transition-transform duration-700"
                                            />
                                            {/* Progress bar line */}
                                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
                                                <div className="h-full bg-[#8b5cf6]" style={{ width: isNext ? '0%' : '0%' }} />
                                            </div>
                                            {/* "Next" play icon on first card */}
                                            {isNext && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <Play size={20} className="text-white fill-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="flex-1 min-w-0 pr-2">
                                            {isNext && (
                                                <span className="inline-block text-[9px] font-black text-[#8b5cf6] uppercase tracking-[0.25em] mb-1.5">Up Next</span>
                                            )}
                                            <h4 className={`text-[13px] font-bold line-clamp-2 leading-snug mb-1.5 transition-colors ${isNext ? 'text-white group-hover/item:text-[#c4b5fd]' : 'text-zinc-300 group-hover/item:text-white'}`}>
                                                {decodeHTML(v.title)}
                                            </h4>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{v.channelTitle}</p>
                                        </div>

                                        {/* Queue position indicator */}
                                        <div className="shrink-0 pr-1">
                                            <span className={`text-[11px] font-black tabular-nums ${isNext ? 'text-[#8b5cf6]' : 'text-zinc-700'}`}>
                                                {isNext ? '▶' : String(i + 1).padStart(2, '0')}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Empty state */}
                            {!relatedLoading && relatedVideos.length === 0 && (
                                <div className="flex flex-col items-center py-10 gap-3 text-center">
                                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                                        <SkipForward size={20} className="text-zinc-600" />
                                    </div>
                                    <p className="text-sm font-bold text-zinc-600">No suggestions yet</p>
                                    <p className="text-[11px] text-zinc-700">Keep listening to get recommendations</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Playback controls ─────────────────────────────────────── */}
                <div className="px-8 pb-10 pt-8 border-t border-white/[0.03] bg-black shrink-0">
                    <div className="max-w-4xl mx-auto flex flex-col gap-10">
                        {/* Progress bar */}
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-bold text-zinc-500 w-12 text-right tabular-nums">{formatTime(currentTime)}</span>
                            <div className="flex-1 h-3 bg-white/5 rounded-full relative cursor-pointer group" onClick={handleSeek}>
                                <div
                                    className="absolute h-full bg-[#8b5cf6] rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                                    style={{ width: `${progressPct}%` }}
                                />
                                <div
                                    className="absolute h-6 w-6 bg-white rounded-full -top-1.5 -ml-3 scale-0 group-hover:scale-100 transition-transform shadow-xl cursor-grab active:cursor-grabbing border-4 border-[#8b5cf6]"
                                    style={{ left: `${progressPct}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-zinc-500 w-12 tabular-nums">{formatTime(duration)}</span>
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center justify-between px-10">
                            <button className="p-3 text-zinc-500 hover:text-white transition-all transform hover:scale-110">
                                <FileText size={20} strokeWidth={2} />
                            </button>
                            <div className="flex items-center gap-12">
                                <button 
                                    onClick={handlePrevious} 
                                    className={`p-5 transition-all transform hover:scale-110 ${playHistory.length > 0 || currentTime > 5 ? 'text-zinc-500 hover:text-white' : 'text-zinc-700/50 cursor-not-allowed'}`}
                                >
                                    <SkipBack size={28} strokeWidth={2} fill="currentColor" />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(139,92,246,0.3)]"
                                >
                                    {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="ml-2" fill="currentColor" />}
                                </button>
                                <button onClick={handleNext} className="p-5 text-zinc-500 hover:text-white transition-all transform hover:scale-110">
                                    <SkipForward size={28} strokeWidth={2} fill="currentColor" />
                                </button>
                            </div>
                            <div
                                className={`p-4 rounded-full transition-all flex items-center gap-3 relative group ${showVolume ? 'bg-white/5 w-48' : 'text-zinc-500 hover:text-white'}`}
                                onMouseEnter={() => setShowVolume(true)}
                                onMouseLeave={() => setShowVolume(false)}
                            >
                                <Volume2 size={22} strokeWidth={2} />
                                {showVolume && (
                                    <input
                                        type="range" min="0" max="100" value={volume}
                                        onChange={(e) => { const v = parseInt(e.target.value); setVolume(v); playerRef.current?.setVolume(v); }}
                                        className="w-32 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-[#8b5cf6]"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Minimized Player (Floats above mobile nav) ──────────────── */}
            <div
                onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); setIsMinimized(false); }}
                className={`fixed bottom-[100px] md:bottom-10 left-4 right-4 md:left-auto md:w-[450px] bg-black backdrop-blur-md border border-white/10 border-t-zinc-800 rounded-3xl p-4 flex items-center gap-6 cursor-pointer hover:bg-zinc-900 transition-[transform,opacity,bottom] duration-700 z-[999] shadow-[0_30px_70px_rgba(0,0,0,0.8)] border-b-4 border-b-[#8b5cf6] pointer-events-auto active:scale-[0.98] ${(!isMinimized || !isPlayerOpen) ? 'opacity-0 translate-y-32 pointer-events-none invisible' : 'opacity-100 translate-y-0 visible'}`}
            >
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-2xl">
                    <Image src={activeVideo.thumbnail} alt={activeVideo.title} fill className="object-cover" />
                    {!isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play size={24} className="text-white fill-white" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-[15px] font-black text-white truncate leading-tight mb-1">{decodeHTML(activeVideo.title)}</h3>
                    <p className="text-[11px] font-bold text-[#8b5cf6] uppercase tracking-widest">{activeVideo.channelTitle}</p>
                    {/* Mini countdown indicator in minimized player */}
                    {countdown !== null && (
                        <p className="text-[9px] font-bold text-zinc-400 mt-1 animate-pulse">
                            Next in {countdown}s…
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 pr-2" onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <button onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); togglePlay(); }} className="p-3 rounded-full hover:bg-white/10 transition-colors text-white">
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button
                        onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); clearCountdown(); setIsPlayerOpen(false); }}
                        className="p-3 rounded-full hover:bg-white/10 transition-colors text-zinc-500"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
