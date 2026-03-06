'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
    Play, Pause, SkipBack, SkipForward,
    Volume2, VolumeX, X, Maximize2, ChevronDown
} from 'lucide-react';
import { useVideoStore } from '@/store/useVideoStore';

// Dynamically import react-youtube to avoid SSR/hydration issues
const YouTube = dynamic(() => import('react-youtube'), { ssr: false });

export default function CustomPlayer() {
    const { activeVideo, isPlayerOpen, setIsPlayerOpen } = useVideoStore();
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [playerError, setPlayerError] = useState(false);
    const playerRef = useRef<any>(null);

    const onReady = useCallback((event: any) => {
        playerRef.current = event.target;
        setPlayerError(false);
        if (isPlaying) event.target.playVideo();
    }, [isPlaying]);

    const onError = useCallback(() => {
        setPlayerError(true);
    }, []);

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
        setIsPlaying((p) => !p);
    };

    const toggleMute = () => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.unMute();
        } else {
            playerRef.current.mute();
        }
        setIsMuted((m) => !m);
    };

    if (!isPlayerOpen || !activeVideo) return null;

    const opts = {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
    };

    return (
        <>
            {/* Hidden YouTube player (audio only in bar mode) */}
            <div className="sr-only" aria-hidden>
                <YouTube
                    videoId={activeVideo.id}
                    opts={opts}
                    onReady={onReady}
                    onError={onError}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
            </div>

            {/* Expanded full-screen overlay */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
                    style={{ background: 'rgba(9,9,11,0.97)', backdropFilter: 'blur(20px)' }}
                >
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-5 left-5 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ChevronDown size={28} />
                    </button>

                    <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
                        style={{ boxShadow: '0 0 60px rgba(168,85,247,0.3)' }}>
                        <YouTube
                            videoId={activeVideo.id}
                            opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, rel: 0, modestbranding: 1 } }}
                        />
                    </div>

                    <div className="mt-6 text-center">
                        <h2 className="text-lg font-bold text-white line-clamp-1 max-w-lg px-4">{activeVideo.title}</h2>
                        <p className="text-sm text-zinc-500 mt-1">{activeVideo.channelTitle}</p>
                    </div>

                    {playerError && (
                        <div className="mt-4 px-5 py-3 rounded-xl text-sm text-amber-400"
                            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                            ⚠️ This video is restricted or unavailable in your region.
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Player Bar */}
            <div
                className="fixed bottom-[60px] md:bottom-0 left-0 right-0 z-[55] flex items-center gap-2 sm:gap-4 px-2 sm:px-4 transition-all duration-300"
                style={{
                    height: '80px',
                    background: 'rgba(9,9,11,0.92)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderTop: '1px solid rgba(168,85,247,0.2)',
                }}
            >
                {/* Swipe-up indicator (mobile only) */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20 md:hidden pointer-events-none" />
                {/* Thumbnail + info */}
                <div className="flex items-center gap-3 min-w-0 w-[260px] shrink-0">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0"
                        style={{ boxShadow: '0 0 12px rgba(168,85,247,0.4)' }}>
                        <Image
                            src={activeVideo.thumbnail}
                            alt={activeVideo.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{activeVideo.title}</p>
                        <p className="text-xs text-zinc-500 truncate">{activeVideo.channelTitle}</p>
                    </div>
                </div>

                {/* Center controls */}
                <div className="flex items-center justify-center gap-4 flex-1">
                    <button
                        className="text-zinc-500 hover:text-white transition-colors"
                        aria-label="Previous"
                    >
                        <SkipBack size={20} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
                    </button>

                    <button
                        className="text-zinc-500 hover:text-white transition-colors"
                        aria-label="Next"
                    >
                        <SkipForward size={20} />
                    </button>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 w-[180px] justify-end shrink-0">
                    {playerError && (
                        <span className="text-xs text-amber-400 hidden sm:block">⚠️ Restricted</span>
                    )}

                    <button
                        onClick={toggleMute}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                    </button>

                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                        aria-label="Expand player"
                    >
                        <Maximize2 size={15} />
                    </button>

                    <button
                        onClick={() => setIsPlayerOpen(false)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                        aria-label="Close player"
                    >
                        <X size={17} />
                    </button>
                </div>
            </div>
        </>
    );
}
