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
                setIsSearchExpanded(false);
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
        setIsSearchExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const closeSearch = () => {
        setIsSearchExpanded(false);
        setShowSuggestions(false);
    };

    return (
        <header
            className="fixed top-0 left-0 md:left-[240px] right-0 z-30 flex items-center justify-between px-6 md:px-8 h-20 border-b-[0.5px] border-zinc-800/50"
            style={{
                background: '#000000',
                backdropFilter: 'blur(40px)',
            }}
        >
            {/* Logo Section */}
            <div className={`flex items-center gap-4 md:gap-8 transition-all duration-300 overflow-hidden ${
                isSearchExpanded ? 'w-0 opacity-0 md:w-auto md:opacity-100 hidden md:flex' : 'w-auto opacity-100 flex'
            }`}>
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="p-1 text-zinc-500 hover:text-white transition-colors md:hidden"
                    aria-label="Open menu"
                >
                    <Menu size={24} strokeWidth={2} />
                </button>
                <div className="flex items-center gap-3 shrink-0 md:hidden">
                    <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                    <span className="text-sm font-bold tracking-tight text-white leading-none">Streamify</span>
                </div>
            </div>

            {/* Expandable Search Bar Area */}
            <div
                className={`relative flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isSearchExpanded
                        ? 'flex-1 max-w-full md:max-w-2xl mx-0 md:mx-4 opacity-100 scale-100'
                        : 'w-0 opacity-0 scale-95 overflow-hidden'
                }`}
                ref={suggestRef}
            >
                <div className="relative w-full flex items-center">
                    <Search
                        className="absolute left-4 text-zinc-500 pointer-events-none"
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
                        className="w-full pl-12 pr-12 py-3 text-sm text-white placeholder-zinc-500 rounded-full outline-none bg-zinc-900/80 border border-zinc-800 focus:border-white/20 backdrop-blur-xl shadow-lg"
                        aria-label="Search videos"
                    />
                    <button
                        onClick={closeSearch}
                        className="absolute right-4 p-1 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                        aria-label="Close search"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                {/* Search Suggestions Dropdown */}
                {isSearchExpanded && showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 py-2 rounded-2xl border border-white/[0.05] shadow-2xl overflow-hidden z-50 backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{ background: 'rgba(9, 9, 11, 0.95)' }}>
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestClick(suggestion)}
                                className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-white/5 transition-colors focus:outline-none"
                            >
                                <Search size={14} className="text-zinc-500 shrink-0" strokeWidth={1.5} />
                                <span className="text-sm text-zinc-300 truncate font-medium">{suggestion}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Tools (Notifications, User, Search Trigger) */}
            <div className={`flex items-center gap-4 md:gap-6 transition-all duration-300`}>
                <button
                    onClick={toggleSearch}
                    className={`p-2.5 text-zinc-400 hover:text-white transition-all bg-zinc-900/50 rounded-full border border-zinc-800/80 hover:border-zinc-700 mx-1 shadow-sm ${
                        isSearchExpanded ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 flex'
                    }`}
                    aria-label="Search"
                >
                    <Search size={20} strokeWidth={2} />
                </button>

                <div className={`items-center gap-6 shrink-0 ${isSearchExpanded ? 'hidden md:flex' : 'hidden md:flex'}`}>
                    <button
                        className="relative p-2 text-zinc-500 hover:text-white transition-all"
                        aria-label="Notifications"
                    >
                        <Bell size={22} strokeWidth={1.5} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#8b5cf6] rounded-full border border-black" />
                    </button>
                    <button
                        className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
                        aria-label="User profile"
                    >
                        <User size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </header>
    );
}
