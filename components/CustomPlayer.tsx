'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
    Play, Pause, SkipBack, SkipForward,
    Volume2, VolumeX, X, Maximize2, ChevronDown, Minimize2, User
} from 'lucide-react';
import { useVideoStore } from '@/store/useVideoStore';
import { saveVideoProgress, getVideoProgress } from '@/lib/progress';
import { decodeHTML } from '@/lib/utils';
import { FileText } from 'lucide-react'; // For Lyrics icon

// Dynamically import react-youtube to avoid SSR/hydration issues
const YouTube = dynamic(() => import('react-youtube'), { ssr: false });

export default function CustomPlayer() {
    const { activeVideo, isPlayerOpen, setIsPlayerOpen, isMinimized, setIsMinimized } = useVideoStore();
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [playerError, setPlayerError] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);
    const [isDescExpanded, setIsDescExpanded] = useState(false);

    const playerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onReady = useCallback((event: any) => {
        playerRef.current = event.target;
        setPlayerError(false);
        const dur = event.target.getDuration();
        setDuration(dur);
        if (isPlaying) event.target.playVideo();

        // Auto-Resume: Seamlessly seek to saved progress
        if (activeVideo) {
            const saved = getVideoProgress(activeVideo.id);
            if (saved && saved.timestamp > 0) {
                event.target.seekTo(saved.timestamp);
            }
        }
    }, [isPlaying, activeVideo]);

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

    const handleSaveProgress = useCallback(() => {
        if (!playerRef.current || !activeVideo) return;
        const curr = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        setCurrentTime(curr);
        setDuration(dur);
        if (curr > 0 && dur > 0) {
            saveVideoProgress(activeVideo, curr, dur);
        }
    }, [activeVideo]);

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!playerRef.current || duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        const newTime = percent * duration;
        playerRef.current.seekTo(newTime);
        setCurrentTime(newTime);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (isPlaying && activeVideo && playerRef.current) {
            saveIntervalRef.current = setInterval(() => {
                handleSaveProgress();
            }, 3000); // 3-second background saving
        } else if (saveIntervalRef.current) {
            clearInterval(saveIntervalRef.current);
        }
        return () => {
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        };
    }, [isPlaying, activeVideo, handleSaveProgress]);

    useEffect(() => {
        return () => {
            handleSaveProgress();
        };
    }, [handleSaveProgress]);

    if (!isPlayerOpen || !activeVideo) return null;

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
    };

    return (
        <div
            className={`fixed inset-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMinimized
                ? 'pointer-events-none opacity-0 translate-y-20'
                : 'bg-black flex flex-col animate-slide-up'
                }`}
        >
            {/* Minimized Player (Ghost Island) */}
            {isMinimized && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg pointer-events-none">
                    <div
                        onClick={() => setIsMinimized(false)}
                        className="group/mini w-full flex items-center gap-4 px-4 py-2.5 rounded-2xl cursor-pointer pointer-events-auto border border-zinc-800/50 shadow-2xl transition-all duration-700 hover:border-zinc-700"
                        style={{
                            background: 'rgba(9, 9, 11, 0.6)',
                            backdropFilter: 'blur(40px)',
                        }}
                    >
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 shrink-0 overflow-hidden border border-zinc-800 relative">
                            <Image src={activeVideo.thumbnail} alt={activeVideo.title} fill className="object-cover" sizes="40px" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/mini:opacity-100 transition-opacity">
                                <Maximize2 size={14} className="text-white" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-white/90 truncate leading-tight">{decodeHTML(activeVideo.title)}</p>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{activeVideo.channelTitle}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                className="p-2 text-white hover:text-red-500 transition-colors"
                            >
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsPlayerOpen(false); }}
                                className="p-2 text-zinc-600 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        {/* Thin Progress Bar at Bottom of Mini */}
                        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-600 transition-all duration-300"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>
                    </div>
                    {/* Background Audio/Hidden Player for Mini-mode logic */}
                    <div className="sr-only">
                        <YouTube
                            videoId={activeVideo.id}
                            opts={{ height: '0', width: '0', playerVars: { ...opts.playerVars, controls: 0 } }}
                            onReady={(e) => {
                                playerRef.current = e.target;
                                const dur = e.target.getDuration();
                                setDuration(dur);
                                // Seek to progress if needed (usually handled by main if sync'd, but extra safety)
                                const saved = getVideoProgress(activeVideo.id);
                                if (saved && saved.timestamp > 0) e.target.seekTo(saved.timestamp);
                            }}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => { setIsPlaying(false); handleSaveProgress(); }}
                        />
                    </div>
                </div>
            )}

            {/* Full-screen Content Expansion */}
            {!isMinimized && (
                <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
                    {/* Header with Chevron Down */}
                    <div className="flex items-center justify-between p-6">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white transition-all hover:bg-white/10"
                        >
                            <ChevronDown size={28} strokeWidth={2} />
                        </button>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Playing from Streamify</p>
                        </div>
                        <button
                            onClick={() => setIsPlayerOpen(false)}
                            className="p-2 text-zinc-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Main Video Area */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-8 px-6 lg:px-12 max-w-7xl mx-auto w-full pb-12 overflow-y-auto no-scrollbar">
                        <div className="flex-1 min-w-0">
                            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 bg-zinc-900">
                                <YouTube
                                    videoId={activeVideo.id}
                                    opts={opts}
                                    onReady={onReady}
                                    onError={onError}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => { setIsPlaying(false); handleSaveProgress(); }}
                                />
                            </div>

                            <div className="mt-8">
                                <h1 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight">
                                    {decodeHTML(activeVideo.title)}
                                </h1>
                                <div className="flex items-center gap-4 mt-4 pb-6 border-b border-white/5">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center shrink-0">
                                        <User size={20} className="text-zinc-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{activeVideo.channelTitle}</p>
                                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-0.5">3.2M Subscribers</p>
                                    </div>
                                    <button className="px-6 py-2.5 rounded-2xl bg-white text-black text-sm font-black hover:bg-zinc-200 transition-colors">
                                        Subscribe
                                    </button>
                                </div>

                                {/* Description / Lyrics Toggle */}
                                <div className="mt-6">
                                    <button
                                        onClick={() => setIsDescExpanded(!isDescExpanded)}
                                        className="w-full text-left p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-white">Description & Lyrics</p>
                                                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                                    {activeVideo.description || "No description available."}
                                                </p>
                                            </div>
                                            <div className="text-zinc-500 group-hover:text-white transition-colors">
                                                {isDescExpanded ? <ChevronDown className="rotate-180" size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </div>
                                        {isDescExpanded && (
                                            <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
                                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                                                    {activeVideo.description || "Enjoy this premium Streamify content."}
                                                </p>
                                                <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-white/5 text-center">
                                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 italic">Synced Lyrics</p>
                                                    <p className="text-sm text-zinc-200 font-medium leading-[2]">
                                                        🎶 Experience high-fidelity audio 🎶<br />
                                                        Immersed in the rhythm, heart beats strong<br />
                                                        Every note a memory, where we belong<br />
                                                        The lights fade out, but the melody remains<br />
                                                        Echoing forever, cutting through the chains.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Up Next (Placeholder) */}
                        <div className="w-full lg:w-[380px] shrink-0">
                            <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 px-2">Up Next</p>
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-4 p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
                                        <div className="w-32 aspect-video rounded-xl bg-zinc-900 shrink-0 border border-white/5 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-white/10" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">Recommended title for professional experience {i}</p>
                                            <p className="text-xs text-zinc-500 mt-1.5 uppercase font-bold tracking-wider">Streamify Original</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Full-screen Playback Bar */}
                    <div className="p-8 border-t border-white/5 bg-zinc-950/50 backdrop-blur-xl">
                        <div className="max-w-4xl mx-auto flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="relative h-1 w-full bg-white/10 rounded-full cursor-pointer group/progress" onClick={handleSeek}>
                                    <div
                                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${(currentTime / duration) * 100}%`, background: '#ef4444', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}
                                    />
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-all bg-red-500 opacity-0 group-hover/progress:opacity-100"
                                        style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-black text-zinc-500 tracking-widest uppercase">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-8">
                                    <button className="text-zinc-500 hover:text-white"><SkipBack size={24} /></button>
                                    <button
                                        onClick={togglePlay}
                                        className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                                    >
                                        {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-1" />}
                                    </button>
                                    <button className="text-zinc-500 hover:text-white"><SkipForward size={24} /></button>
                                </div>
                                <div className="flex items-center gap-6">
                                    <button onClick={toggleMute} className="text-zinc-500 hover:text-white">
                                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </button>
                                    <button className="text-zinc-500 hover:text-white"><Maximize2 size={24} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Minimized Bottom Bar (PIP style) */}
            {isMinimized && (
                <div className="flex items-end justify-center h-full px-6 pb-24 md:pb-8 pointer-events-none">
                    <div
                        className="w-full max-w-lg h-20 rounded-[2rem] bg-zinc-900/90 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center gap-4 px-4 pointer-events-auto transform hover:scale-[1.02] active:scale-95 transition-all group/mini animate-in slide-in-from-bottom-5 duration-500 cursor-pointer"
                        onClick={() => setIsMinimized(false)}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 shrink-0 overflow-hidden border border-white/5 relative">
                            <Image src={activeVideo.thumbnail} alt={activeVideo.title} fill className="object-cover" sizes="48px" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/mini:opacity-100 transition-opacity">
                                <Maximize2 size={16} className="text-white" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate leading-tight">{decodeHTML(activeVideo.title)}</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{activeVideo.channelTitle}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                className="p-2 text-white hover:text-red-500 transition-colors"
                            >
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsPlayerOpen(false); }}
                                className="p-2 text-zinc-600 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        {/* Thin Progress Bar at Bottom of Mini */}
                        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-600 transition-all duration-300"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Background Audio/Hidden Player for Mini-mode logic */}
                    <div className="sr-only">
                        <YouTube
                            videoId={activeVideo.id}
                            opts={{ height: '0', width: '0', playerVars: { ...opts.playerVars, controls: 0 } }}
                            onReady={(e) => {
                                playerRef.current = e.target;
                                const dur = e.target.getDuration();
                                setDuration(dur);
                                // Seek to progress if needed (usually handled by main if sync'd, but extra safety)
                                const saved = getVideoProgress(activeVideo.id);
                                if (saved && saved.timestamp > 0) e.target.seekTo(saved.timestamp);
                            }}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => { setIsPlaying(false); handleSaveProgress(); }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
