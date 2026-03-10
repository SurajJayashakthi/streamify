'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Bell, User, Sparkles, Menu } from 'lucide-react';
import { useVideoStore } from '@/store/useVideoStore';

export default function Navbar() {
    const { searchQuery, setSearchQuery, setIsDrawerOpen } = useVideoStore();
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestRef = useRef<HTMLDivElement>(null);

    // Debounce suggestions
    useEffect(() => {
        const query = inputValue.trim();
        if (!query) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSuggestions([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setSuggestions(data.suggestions || []);
            } catch (err) {
                console.error(err);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [inputValue]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && inputValue.trim()) {
                setSearchQuery(inputValue.trim());
                setShowSuggestions(false);
            }
        },
        [inputValue, setSearchQuery]
    );

    const handleSuggestClick = (suggestion: string) => {
        setInputValue(suggestion);
        setSearchQuery(suggestion);
        setShowSuggestions(false);
    };

    return (
        <header
            className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-8 md:px-12 h-16 border-b border-zinc-800/40"
            style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(40px)',
            }}
        >
            {/* Logo/Hamburger */}
            <div className="flex items-center gap-8">
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="p-1 text-zinc-500 hover:text-white transition-colors md:hidden"
                    aria-label="Open menu"
                >
                    <Menu size={24} strokeWidth={2} />
                </button>
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                    <span className="text-sm font-bold tracking-tight text-white leading-none">Streamify</span>
                </div>
            </div>

            {/* Search bar centered - visible on mobile now */}
            <div className="absolute left-1/2 -translate-x-1/2 w-[calc(100%-160px)] md:w-full max-w-lg group relative" ref={suggestRef}>
                <Search
                    className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors pointer-events-none"
                    size={16}
                    strokeWidth={2}
                />
                <input
                    type="text"
                    placeholder="Search your favorite music..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 md:pl-14 pr-4 md:pr-6 py-2 md:py-3 text-xs md:text-sm text-white placeholder-zinc-500 rounded-full outline-none transition-all duration-500 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 focus:border-white/20 backdrop-blur-md"
                    aria-label="Search videos"
                />

                {/* Search Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 py-2 rounded-2xl border border-white/5 shadow-2xl overflow-hidden z-50 backdrop-blur-3xl"
                        style={{ background: 'rgba(9, 9, 11, 0.9)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestClick(suggestion)}
                                className="w-full flex items-center gap-4 px-5 py-2.5 text-left hover:bg-white/5 transition-colors focus:outline-none focus:bg-indigo-500/10"
                            >
                                <Search size={14} className="text-zinc-500 shrink-0" strokeWidth={1.5} />
                                <span className="text-[13px] text-zinc-300 truncate font-medium">{suggestion}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-8">
                <button
                    className="relative p-2 text-zinc-500 hover:text-white transition-all"
                    aria-label="Notifications"
                >
                    <Bell size={24} strokeWidth={2} />
                </button>
                <button
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
                    aria-label="User profile"
                >
                    <User size={20} strokeWidth={2} />
                </button>
            </div>
        </header>
    );
}
