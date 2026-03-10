'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
    Play, Pause, SkipBack, SkipForward,
    Volume2, VolumeX, X, Maximize2, ChevronDown, User, FileText
} from 'lucide-react';
import { useVideoStore, YouTubeVideo } from '@/store/useVideoStore';
import { saveVideoProgress, getVideoProgress } from '@/lib/progress';
import { decodeHTML } from '@/lib/utils';
import { getRelatedVideos } from '@/lib/youtube';

// Dynamically import react-youtube
const YouTube = dynamic(() => import('react-youtube'), { ssr: false });

export default function CustomPlayer() {
    const { activeVideo, setActiveVideo, isPlayerOpen, setIsPlayerOpen, isMinimized, setIsMinimized, autoPlay, setAutoPlay } = useVideoStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [playerError, setPlayerError] = useState(false);
    const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
    const [countdown, setCountdown] = useState<number | null>(null);

    const playerRef = useRef<any>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);

    // Single Persistent Player Logic
    const onReady = useCallback((event: any) => {
        playerRef.current = event.target;
        setPlayerError(false);
        setDuration(event.target.getDuration());

        // Fetch related videos
        if (activeVideo) {
            getRelatedVideos(activeVideo.id).then(setRelatedVideos);
        }

        // Auto-Resume
        if (activeVideo) {
            const saved = getVideoProgress(activeVideo.id);
            if (saved && saved.timestamp > 0) {
                event.target.seekTo(saved.timestamp);
            }
        }
        event.target.playVideo();
    }, [activeVideo]);

    const onStateChange = useCallback((event: any) => {
        // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
        const state = event.data;
        setIsPlaying(state === 1);

        if (state === 0) { // ENDED
            if (autoPlay && relatedVideos.length > 0) {
                setCountdown(3);
            }
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'none';
            }
            if (silentAudioRef.current) silentAudioRef.current.pause();
        } else if (state === 1) { // PLAYING
            setCountdown(null);
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
            if (silentAudioRef.current) silentAudioRef.current.play().catch(() => { });

            // Start 500ms sync interval when playing
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = setInterval(() => {
                if (playerRef.current) {
                    setCurrentTime(playerRef.current.getCurrentTime());
                }
            }, 500);
        } else if (state === 2) { // PAUSED
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';
            }
            if (silentAudioRef.current) silentAudioRef.current.pause();
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        } else {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
    }, [autoPlay, relatedVideos]);

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!playerRef.current || duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percent * duration;
        setCurrentTime(newTime);
        playerRef.current.seekTo(newTime);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Auto-save and visibility logic
    useEffect(() => {
        const saveInterval = setInterval(() => {
            if (playerRef.current && activeVideo && isPlaying) {
                saveVideoProgress(activeVideo, playerRef.current.getCurrentTime(), playerRef.current.getDuration());
            }
        }, 5000);
        return () => clearInterval(saveInterval);
    }, [activeVideo, isPlaying]);

    // Handle browser back button (popstate)
    useEffect(() => {
        if (!isPlayerOpen) return;

        // Push a state when the player opens so "Back" can close/minimize it
        if (!isMinimized) {
            window.history.pushState({ playerOpen: true }, '');
        }

        const handlePopState = (event: PopStateEvent) => {
            if (!isMinimized) {
                event.preventDefault();
                setIsMinimized(true);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isPlayerOpen, isMinimized, setIsMinimized]);

    // Media Session & Silent Audio Hack
    useEffect(() => {
        if (!activeVideo) return;

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: decodeHTML(activeVideo.title),
                artist: activeVideo.channelTitle,
                album: 'Streamify',
                artwork: [
                    { src: activeVideo.thumbnail, sizes: '512x512', type: 'image/jpg' },
                ],
            });

            navigator.mediaSession.setActionHandler('play', () => {
                playerRef.current?.playVideo();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                playerRef.current?.pauseVideo();
            });
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                // Implement if track list exists
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                if (relatedVideos.length > 0) setActiveVideo(relatedVideos[0]);
            });
        }

        // Silent Audio Loop Trick
        if (!silentAudioRef.current) {
            const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // Fallback or a tiny silent mp3 link
            audio.loop = true;
            audio.volume = 0; // Silent
            silentAudioRef.current = audio;
        }

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = null;
            }
            if (silentAudioRef.current) {
                silentAudioRef.current.pause();
                silentAudioRef.current = null;
            }
        };
    }, [activeVideo, relatedVideos, setActiveVideo]);

    // Countdown logic
    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) {
            if (relatedVideos.length > 0) {
                setActiveVideo(relatedVideos[0]);
                setCountdown(null);
            }
            return;
        }

        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, relatedVideos, setActiveVideo]);

    if (!isPlayerOpen || !activeVideo) return null;

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
    };

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* FULLSCREEN PLAYER OVERLAY */}
            <div
                className={`absolute inset-0 bg-black flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${isMinimized ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-10 py-8">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-3 rounded-full bg-white/5 text-zinc-400 hover:text-white transition-all hover:bg-white/10"
                    >
                        <ChevronDown size={32} strokeWidth={1.5} />
                    </button>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Auto-Play</p>
                        <button
                            onClick={() => setAutoPlay(!autoPlay)}
                            className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${autoPlay ? 'bg-[#8b5cf6]' : 'bg-zinc-700'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${autoPlay ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                    <button onClick={() => setIsPlayerOpen(false)} className="p-3 text-zinc-400 hover:text-white">
                        <X size={28} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center px-8 lg:px-12 max-w-2xl mx-auto w-full pb-12 overflow-y-auto no-scrollbar py-10">
                    <div className="w-full aspect-square md:aspect-video rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 bg-zinc-900 group/player relative">
                        {/* THE PERSISTENT VIDEO INSTANCE */}
                        <YouTube
                            videoId={activeVideo.id}
                            opts={opts}
                            onReady={onReady}
                            onStateChange={onStateChange}
                            className={`w-full h-full transition-opacity duration-500 ${isMinimized ? 'opacity-0' : 'opacity-100'}`}
                        />
                        {!isPlaying && !countdown && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none transition-all">
                                <Play size={80} fill="white" className="text-white opacity-40" />
                            </div>
                        )}
                        {countdown !== null && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center transition-all z-10">
                                <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-4">Up Next in</p>
                                <span className="text-7xl font-black text-white">{countdown}</span>
                                <button
                                    onClick={() => setCountdown(null)}
                                    className="mt-8 px-6 py-2 rounded-full border border-white/10 text-xs font-bold text-white hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 text-center w-full">
                        <h1 className="text-3xl font-bold tracking-tighter text-white leading-tight line-clamp-2">
                            {decodeHTML(activeVideo.title)}
                        </h1>
                        <p className="text-lg font-medium text-zinc-400 mt-4">{activeVideo.channelTitle}</p>
                    </div>

                    {/* Up Next Rail */}
                    <div className="mt-10 w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Up Next</h3>
                        </div>
                        <div className="flex flex-col gap-4">
                            {relatedVideos.slice(0, 5).map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => setActiveVideo(v)}
                                    className="flex gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all text-left group"
                                >
                                    <div className="w-24 aspect-video rounded-lg overflow-hidden relative shrink-0">
                                        <Image src={v.thumbnail} alt={v.title} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate group-hover:text-[#8b5cf6] transition-colors">
                                            {decodeHTML(v.title)}
                                        </h4>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                            {v.channelTitle}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lyrics */}
                    <div className="mt-10 w-full mb-20">
                        <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 text-center relative overflow-hidden backdrop-blur-xl">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex justify-center items-center gap-2">
                                <FileText size={14} strokeWidth={2} /> Lyrics
                            </p>
                            <p className="text-xl text-white font-medium leading-[1.8] tracking-tight">
                                🎶 Music is the language of the soul 🎶<br />
                                Lost in the sound, where we find our home<br />
                                Every beat a heartbeat, never alone.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Playback Bar (Full) */}
                <div className="px-8 py-12 border-t border-white/5 bg-black/80 backdrop-blur-3xl">
                    <div className="max-w-4xl mx-auto flex flex-col gap-10">
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-bold text-zinc-500 w-12 text-right">{formatTime(currentTime)}</span>
                            <div className="relative flex-1 h-[2px] cursor-pointer group/progress flex items-center" onClick={handleSeek}>
                                <div className="w-full h-full bg-white/10 rounded-full relative overflow-hidden">
                                    <div className="absolute top-0 left-0 h-full bg-red-600" style={{ width: `${(currentTime / duration) * 100}%` }} />
                                </div>
                                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full transition-all scale-0 group-hover/progress:scale-100" style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }} />
                            </div>
                            <span className="text-xs font-bold text-zinc-500 w-12">{formatTime(duration)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-zinc-500"><Volume2 size={32} strokeWidth={1.5} /></div>
                            <div className="flex items-center gap-14">
                                <button className="text-zinc-500 hover:text-white"><SkipBack size={36} strokeWidth={1.5} /></button>
                                <button onClick={togglePlay} className="w-[90px] h-[90px] rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                                    {isPlaying ? <Pause size={40} fill="black" /> : <Play size={40} fill="black" className="ml-1" />}
                                </button>
                                <button className="text-zinc-500 hover:text-white"><SkipForward size={36} strokeWidth={1.5} /></button>
                            </div>
                            <div className="text-zinc-500"><Maximize2 size={32} strokeWidth={1.5} /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MINIMIZED MINI-PLAYER BAR */}
            <div
                className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg h-20 rounded-2xl bg-zinc-900/95 backdrop-blur-3xl border border-white/10 shadow-2xl transition-all duration-700 pointer-events-auto flex items-center px-4 gap-4 cursor-pointer group/mini ${isMinimized ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95 pointer-events-none'
                    }`}
                onClick={() => setIsMinimized(false)}
            >
                {/* Thumbnail/Video Swap */}
                <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden relative border border-white/5 shrink-0">
                    <Image src={activeVideo.thumbnail} alt={activeVideo.title} fill className="object-cover" sizes="48px" />
                    {/* The same video instance is actually logically here too, but for UI we just show thumb in mini for simplicity or can move video here */}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate leading-tight">{decodeHTML(activeVideo.title)}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{activeVideo.channelTitle}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-2 text-white hover:text-red-500 transition-colors">
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setIsPlayerOpen(false); }} className="p-2 text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress in Mini */}
                <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600" style={{ width: `${(currentTime / duration) * 100}%` }} />
                </div>
            </div>
        </div>
    );
}
