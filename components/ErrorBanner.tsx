'use client';

import { AlertTriangle, Key, Wifi, RefreshCw, ShieldOff } from 'lucide-react';
import { YouTubeAPIError } from '@/lib/youtube';

interface ErrorBannerProps {
    error: YouTubeAPIError | Error | unknown;
    onRetry?: () => void;
}

const errorConfig = {
    MISSING_KEY: {
        icon: Key,
        title: 'API Key Missing',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)',
        border: 'rgba(245,158,11,0.25)',
    },
    QUOTA_EXCEEDED: {
        icon: AlertTriangle,
        title: 'Quota Exceeded',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.25)',
    },
    RESTRICTED: {
        icon: ShieldOff,
        title: 'Access Denied',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)',
        border: 'rgba(245,158,11,0.25)',
    },
    NETWORK: {
        icon: Wifi,
        title: 'Network Error',
        color: '#a855f7',
        bg: 'rgba(168,85,247,0.1)',
        border: 'rgba(168,85,247,0.25)',
    },
    UNKNOWN: {
        icon: AlertTriangle,
        title: 'Something Went Wrong',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.25)',
    },
};

export default function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
    const code =
        error instanceof YouTubeAPIError ? error.code : 'UNKNOWN';
    const message =
        error instanceof Error ? error.message : 'An unexpected error occurred.';

    const config = errorConfig[code] ?? errorConfig.UNKNOWN;
    const Icon = config.icon;

    return (
        <div
            className="flex flex-col items-center justify-center w-full py-20 px-6 text-center"
        >
            <div
                className="flex flex-col items-center gap-4 max-w-md p-8 rounded-2xl"
                style={{
                    background: config.bg,
                    border: `1px solid ${config.border}`,
                }}
            >
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: `${config.color}22` }}
                >
                    <Icon size={28} style={{ color: config.color }} />
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{config.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{message}</p>

                    {code === 'MISSING_KEY' && (
                        <div className="mt-4 text-left p-3 rounded-xl bg-black/30 text-xs font-mono text-zinc-400">
                            <p className="text-zinc-500 mb-1">In your <span className="text-purple-400">.env.local</span>:</p>
                            <p>NEXT_PUBLIC_YOUTUBE_API_KEY=<span className="text-green-400">your_key_here</span></p>
                        </div>
                    )}
                </div>

                {onRetry && code !== 'MISSING_KEY' && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
                    >
                        <RefreshCw size={15} />
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
}
