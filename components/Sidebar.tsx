'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Library,
    TrendingUp,
    Music2,
    Gamepad2,
    ThumbsUp,
    ListMusic,
    Podcast,
    Radio,
    Sparkles,
} from 'lucide-react';
import { useVideoStore } from '@/store/useVideoStore';

// Each item carries the `query` it sets when clicked so active detection is accurate
const navItems = [
    { label: 'Home',     icon: Home,      href: '/', query: '__HOME__' },
    { label: 'Trending', icon: TrendingUp, href: '/', query: 'trending music 2026' },
    { label: 'Music',    icon: Music2,     href: '/', query: 'new music 2026' },
    { label: 'Gaming',   icon: Gamepad2,  href: '/', query: 'gaming music epic' },
    { label: 'Liked',    icon: ThumbsUp,  href: '/', query: '__FAVORITES__' },
];

const libraryItems = [
    { label: 'Live',      icon: Radio,     query: 'live music concert' },
    { label: 'Podcasts',  icon: Podcast,   query: 'podcasts music' },
    { label: 'Playlists', icon: ListMusic, query: 'playlist mix' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { searchQuery, setSearchQuery } = useVideoStore();

    const handleNavClick = (query: string) => {
        setSearchQuery(query);
    };

    return (
        <>
            {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
            <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[240px] z-40 bg-black border-r-[0.5px] border-zinc-800/50">

                {/* Logo */}
                <div className="flex items-center gap-4 px-8 h-20 shrink-0">
                    <Sparkles className="w-5 h-5 text-white shrink-0" strokeWidth={2} />
                    <span className="text-sm font-bold tracking-tight text-white leading-none">Streamify</span>
                </div>

                {/* Main Nav */}
                <nav className="flex flex-col gap-y-8 px-3 mt-4">
                    {navItems.map(({ label, href, icon: Icon, query }) => {
                        const isActive = pathname === href && searchQuery === query;
                        return (
                            <Link
                                key={label}
                                href={href}
                                onClick={() => handleNavClick(query)}
                                className={`relative flex items-center gap-6 py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-300 group overflow-hidden ${
                                    isActive
                                        ? 'text-[#8b5cf6] bg-[#8b5cf6]/8'
                                        : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                                }`}
                            >
                                {/* Purple active bar on left edge */}
                                <span
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[4px] rounded-r-full transition-all duration-300 border-l-[4px] border-solid ${
                                        isActive ? 'h-6 border-[#8b5cf6]' : 'h-0 border-transparent'
                                    }`}
                                />
                                <Icon
                                    size={22}
                                    strokeWidth={1.5}
                                    className={`shrink-0 transition-colors ${
                                        isActive ? 'text-[#8b5cf6]' : 'text-zinc-500 group-hover:text-white'
                                    }`}
                                />
                                <span className="truncate">{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Library Nav */}
                <nav className="flex flex-col gap-y-8 px-3 pt-10">
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] px-5 mb-2">
                        Your Space
                    </p>
                    {libraryItems.map(({ label, icon: Icon, query }) => {
                        const isActive = searchQuery === query;
                        return (
                            <button
                                key={label}
                                onClick={() => handleNavClick(query)}
                                className={`relative flex items-center gap-6 py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-300 group w-full text-left overflow-hidden ${
                                    isActive
                                        ? 'text-[#8b5cf6] bg-[#8b5cf6]/8'
                                        : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                                }`}
                            >
                                <span
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[4px] rounded-r-full transition-all duration-300 border-l-[4px] border-solid ${
                                        isActive ? 'h-6 border-[#8b5cf6]' : 'h-0 border-transparent'
                                    }`}
                                />
                                <Icon
                                    size={22}
                                    strokeWidth={1.5}
                                    className={`shrink-0 transition-colors ${
                                        isActive ? 'text-[#8b5cf6]' : 'text-zinc-500 group-hover:text-white'
                                    }`}
                                />
                                <span className="truncate">{label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Premium Promo — pinned to bottom, not stretched */}
                <div className="mt-auto mb-6 mx-4">
                    <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60">
                        <p className="text-[10px] font-black text-[#8b5cf6] mb-1.5 uppercase tracking-widest">
                            Upgrade
                        </p>
                        <p className="text-[10px] text-zinc-600 leading-relaxed font-medium">
                            Ad-free streaming &amp; spatial audio.
                        </p>
                    </div>
                </div>
            </aside>

            {/* ── Mobile Bottom Navigation ──────────────────────────────────── */}
            <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 md:px-6">
                <nav className="flex items-center justify-around gap-4 px-4 py-2 bg-zinc-950/90 backdrop-blur-2xl border border-white/[0.06] rounded-[2rem] shadow-2xl w-full max-w-md mx-auto">
                    {[
                        { label: 'Home',    icon: Home,    href: '/', query: '__HOME__' },
                        { label: 'Library', icon: Library, href: '/', query: '__FAVORITES__' },
                    ].map(({ label, href, icon: Icon, query }) => {
                        const isActive = pathname === href && searchQuery === query;
                        return (
                            <button
                                key={label}
                                onClick={() => handleNavClick(query)}
                                className={`flex flex-col items-center justify-center gap-1.5 px-6 py-4 rounded-3xl transition-all duration-300 flex-1 relative ${
                                    isActive
                                        ? 'text-[#8b5cf6] bg-[#8b5cf6]/10'
                                        : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                            >
                                <Icon
                                    size={22}
                                    strokeWidth={1.5}
                                    className={isActive ? 'text-[#8b5cf6]' : ''}
                                />
                                <span className="text-[9px] font-black tracking-widest uppercase">
                                    {label}
                                </span>
                                {isActive && (
                                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#8b5cf6] rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
