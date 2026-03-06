'use client';

import { useState, useCallback } from 'react';
import { Search, Bell, User, Sparkles } from 'lucide-react';
import { useVideoStore } from '@/store/useVideoStore';

export default function Navbar() {
    const { searchQuery, setSearchQuery } = useVideoStore();
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && inputValue.trim()) {
                setSearchQuery(inputValue.trim());
            }
        },
        [inputValue, setSearchQuery]
    );

    return (
        <header
            className="fixed top-0 right-0 z-30 flex items-center gap-4 px-5 py-3"
            style={{
                left: 0,
                background: 'rgba(9,9,11,0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                height: '64px',
            }}
        >
            {/* Left spacer for sidebar on desktop */}
            <div className="hidden md:block w-[240px] shrink-0" />

            {/* Logo on mobile */}
            <div className="md:hidden flex items-center gap-2 mr-1 sm:mr-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-sm sm:text-base font-bold text-white shrink-0 hidden xs:inline-block">Streamify</span>
            </div>

            {/* Search bar */}
            <div className="flex-1 max-w-xl min-w-[120px] sm:min-w-[200px] relative">
                <Search
                    className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                    size={16}
                />
                <input
                    type="text"
                    placeholder="Search…"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 rounded-full sm:rounded-xl outline-none transition-all duration-300 focus:ring-2 focus:ring-purple-500/50 bg-white/5 border border-white/10 hover:border-white/20"
                    aria-label="Search videos"
                />
                {inputValue && (
                    <button
                        onClick={() => { setSearchQuery(inputValue.trim()); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        Go
                    </button>
                )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
                <button
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:bg-white/10"
                    aria-label="Notifications"
                >
                    <Bell size={18} />
                </button>
                <button
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
                    aria-label="User profile"
                >
                    <User size={15} />
                </button>
            </div>
        </header>
    );
}
