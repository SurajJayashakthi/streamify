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

// Dynamically import react-youtube
const YouTube = dynamic(() => import('react-youtube'), { ssr: false });

export default function CustomPlayer() {
    const {
        activeVideo,
        setActiveVideo,
        isPlayerOpen,
        setIsPlayerOpen,
        isMinimized,
        setIsMinimized,
        autoPlay,
        setAutoPlay
    } = useVideoStore();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [showVolume, setShowVolume] = useState(false);
    const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);

    const handlePlayNext = useCallback(() => {
        const nextVideo = relatedVideos[0];
        if (nextVideo) {
            setActiveVideo(nextVideo);
        } else {
            setIsPlaying(false);
        }
    }, [relatedVideos, setActiveVideo]);

    const onReady = useCallback((event: { target: any }) => {
        playerRef.current = event.target;
        setDuration(event.target.getDuration());

        if (activeVideo) {
            getRelatedVideos(activeVideo.id).then(setRelatedVideos);
            const saved = getVideoProgress(activeVideo.id);
            if (saved && saved.timestamp > 0) {
                event.target.seekTo(saved.timestamp);
            }
        }
        event.target.playVideo();
    }, [activeVideo]);

    const onStateChange = useCallback((event: { data: number }) => {
        const state = event.data;
        setIsPlaying(state === 1);

        if (state === 0) { // ENDED
            if (autoPlay) {
                handlePlayNext();
            }
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'none';
            }
            if (silentAudioRef.current) silentAudioRef.current.pause();
        } else if (state === 1) { // PLAYING
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
            if (silentAudioRef.current) silentAudioRef.current.play().catch(() => { });

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
        }
    }, [autoPlay, handlePlayNext]);

    const togglePlay = useCallback(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    }, [isPlaying]);

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!playerRef.current || duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percent * duration;
        setCurrentTime(newTime);
        playerRef.current.seekTo(newTime);
    }, [duration]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Effects
    useEffect(() => {
        const saveInterval = setInterval(() => {
            if (playerRef.current && activeVideo && isPlaying) {
                saveVideoProgress(activeVideo, playerRef.current.getCurrentTime(), playerRef.current.getDuration());
            }
        }, 5000);
        return () => clearInterval(saveInterval);
    }, [activeVideo, isPlaying]);

    useEffect(() => {
        if (!isPlayerOpen) return;
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

    useEffect(() => {
        if ('mediaSession' in navigator && activeVideo) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: decodeHTML(activeVideo.title),
                artist: activeVideo.channelTitle,
                artwork: [
                    { src: activeVideo.thumbnail, sizes: '512x512', type: 'image/jpeg' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => {
                playerRef.current?.playVideo();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                playerRef.current?.pauseVideo();
            });
            navigator.mediaSession.setActionHandler('nexttrack', handlePlayNext);
        }
    }, [activeVideo, handlePlayNext]);

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
            <div
                className={`absolute inset-0 bg-black flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto h-[100dvh] overflow-hidden ${isMinimized ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'
                    }`}
            >
                {/* Header */}
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
                            onClick={() => setAutoPlay(!autoPlay)}
                            className={`w-11 h-6 rounded-full relative transition-all duration-500 ${autoPlay ? 'bg-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-zinc-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-sm ${autoPlay ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center px-8 lg:px-12 max-w-4xl mx-auto w-full overflow-y-auto no-scrollbar py-6">
                    <div className="w-full max-h-[60vh] aspect-video rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 bg-zinc-900 group/player relative">
                        <YouTube
                            videoId={activeVideo.id}
                            opts={opts}
                            onReady={onReady}
                            onStateChange={onStateChange}
                            className="w-full h-full"
                        />
                    </div>

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

                    <div className="w-full mt-16 max-w-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.25em]">Up Next</h3>
                            <button className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-widest hover:text-white transition-colors">See All</button>
                        </div>
                        <div className="flex flex-col gap-4">
                            {relatedVideos.slice(0, 5).map((v, i) => (
                                <button
                                    key={v.id}
                                    onClick={() => setActiveVideo(v)}
                                    className="flex items-center gap-5 p-4 rounded-3xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all group/item text-left"
                                >
                                    <div className="relative w-28 aspect-video rounded-xl overflow-hidden shrink-0">
                                        <Image src={v.thumbnail} alt={v.title} fill className="object-cover group-hover/item:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                                            <div className="h-full bg-[#8b5cf6]" style={{ width: i === 0 ? '40%' : '0%' }} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-[13px] font-bold text-white line-clamp-1 leading-none mb-2 group-hover/item:text-[#8b5cf6] transition-colors">{decodeHTML(v.title)}</h4>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{v.channelTitle}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="px-8 pb-10 pt-8 border-t border-white/[0.03] bg-black shrink-0">
                    <div className="max-w-4xl mx-auto flex flex-col gap-10">
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-bold text-zinc-500 w-12 text-right">{formatTime(currentTime)}</span>
                            <div
                                className="flex-1 h-3 bg-white/5 rounded-full relative cursor-pointer group"
                                onClick={handleSeek}
                            >
                                <div
                                    className="absolute h-full bg-[#8b5cf6] rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                />
                                <div
                                    className="absolute h-6 w-6 bg-white rounded-full -top-1.5 -ml-3 scale-0 group-hover:scale-100 transition-transform shadow-xl cursor-grab active:cursor-grabbing border-4 border-[#8b5cf6]"
                                    style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-zinc-500 w-12">{formatTime(duration)}</span>
                        </div>

                        <div className="flex items-center justify-between px-10">
                            <button className="p-3 text-zinc-500 hover:text-white transition-all transform hover:scale-110">
                                <FileText size={20} strokeWidth={2} />
                            </button>
                            <div className="flex items-center gap-12">
                                <button className="p-5 text-zinc-500 hover:text-white transition-all transform hover:scale-110">
                                    <SkipBack size={28} strokeWidth={2} fill="currentColor" />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(139,92,246,0.3)]"
                                >
                                    {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="ml-2" fill="currentColor" />}
                                </button>
                                <button
                                    onClick={handlePlayNext}
                                    className="p-5 text-zinc-500 hover:text-white transition-all transform hover:scale-110"
                                >
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
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value);
                                            setVolume(v);
                                            playerRef.current?.setVolume(v);
                                        }}
                                        className="w-32 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-[#8b5cf6]"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Minimized Player */}
            <div
                onClick={() => setIsMinimized(false)}
                className={`fixed bottom-10 right-10 left-10 md:left-auto md:w-[450px] bg-zinc-950/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-4 flex items-center gap-6 cursor-pointer hover:bg-white/[0.04] transition-all duration-700 z-[110] shadow-[0_30px_70px_rgba(0,0,0,0.8)] border-b-4 border-b-[#8b5cf6] active:scale-[0.98] ${!isMinimized ? 'opacity-0 translate-y-32 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}
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
                </div>
                <div className="flex items-center gap-2 pr-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={togglePlay}
                        className="p-3 rounded-full hover:bg-white/10 transition-colors text-white"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsPlayerOpen(false);
                        }}
                        className="p-3 rounded-full hover:bg-white/10 transition-colors text-zinc-500"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
