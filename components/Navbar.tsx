'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Bell, User, Sparkles, Menu, X } from 'lucide-react';
import { useVideoStore } from '@/store/useVideoStore';

export default function Navbar() {
    const { setSearchQuery, setIsDrawerOpen } = useVideoStore();
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const suggestRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
        setIsSearchExpanded(false);
    };

    const toggleSearch = () => {
        setIsSearchExpanded(!isSearchExpanded);
        if (!isSearchExpanded) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    return (
        <header
            className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-8 h-20 border-b border-zinc-800/50"
            style={{
                background: '#000000',
                backdropFilter: 'blur(40px)',
            }}
        >
            {/* Logo Section */}
            {!isSearchExpanded && (
                <div className="flex items-center gap-8 transition-opacity duration-300">
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
            )}

            {/* Expandable Search Bar Area */}
            <div
                className={`relative flex items-center transition-all duration-500 ease-in-out ${isSearchExpanded
                    ? 'flex-1 md:max-w-2xl mx-4'
                    : 'w-0 overflow-hidden opacity-0'
                    }`}
                ref={suggestRef}
            >
                <div className="relative w-full">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                        size={18}
                        strokeWidth={2}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search your favorite music..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        className="w-full pl-12 pr-12 py-3 text-sm text-white placeholder-zinc-500 rounded-full outline-none bg-zinc-900/50 border border-zinc-800 focus:border-white/20 backdrop-blur-md"
                        aria-label="Search videos"
                    />
                    <button
                        onClick={() => setIsSearchExpanded(false)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Search Suggestions Dropdown */}
                {isSearchExpanded && showSuggestions && suggestions.length > 0 && (
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
            <div className="flex items-center gap-6">
                {!isSearchExpanded && (
                    <button
                        onClick={toggleSearch}
                        className="p-2 text-zinc-500 hover:text-white transition-all bg-zinc-900/30 rounded-full border border-zinc-800/50"
                        aria-label="Search"
                    >
                        <Search size={22} strokeWidth={2} />
                    </button>
                )}

                {!isSearchExpanded && (
                    <div className="hidden md:flex items-center gap-6">
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
                )}
            </div>
        </header>
    );
}
