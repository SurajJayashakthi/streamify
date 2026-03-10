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
    Radio,
    Podcast,
    ListMusic,
    Zap,
    Sparkles,
} from 'lucide-react';
import { useVideoStore } from '@/store/useVideoStore';

const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Trending', icon: TrendingUp, href: '/?q=trending' },
    { label: 'Music', icon: Music2, href: '/?q=music' },
    { label: 'Gaming', icon: Gamepad2, href: '/?q=gaming' },
    { label: 'Liked', icon: ThumbsUp, href: '/?q=liked' },
];

const libraryItems = [
    { label: 'Live', icon: Radio, href: '/?q=live' },
    { label: 'Podcasts', icon: Podcast, href: '/?q=podcasts' },
    { label: 'Playlists', icon: ListMusic, href: '/?q=playlists' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { setSearchQuery } = useVideoStore();

    const handleNavClick = (query?: string) => {
        if (query) {
            setSearchQuery(query);
        } else {
            setSearchQuery('lofi music chill beats'); // Default Home
        }
    };
    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[240px] z-40 bg-black border-right border-zinc-800/40"
            >
                {/* Logo Section */}
                <div className="flex items-center gap-4 px-10 py-10 h-16">
                    <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                    <span className="text-sm font-bold tracking-tight text-white leading-none">
                        Streamify
                    </span>
                </div>

                {/* Main Nav */}
                <nav className="flex flex-col gap-6 px-4 pt-10">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-6 mb-2">Primary</p>
                    {navItems.map(({ label, icon: Icon, href }) => {
                        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
                        return (
                            <Link
                                key={label}
                                href={href}
                                className={`flex items-center gap-6 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-500 group relative ${isActive
                                    ? 'bg-white/5 text-[#8b5cf6] shadow-[inset_0_0_20px_rgba(139,92,246,0.05)]'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#8b5cf6] rounded-r-full shadow-[4px_0_15px_rgba(139,92,246,0.4)]" />
                                )}
                                <Icon
                                    className={`w-6 h-6 transition-colors ${isActive ? 'text-[#8b5cf6]' : 'text-zinc-500 group-hover:text-white'}`}
                                    strokeWidth={1.5}
                                />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Library Nav */}
                <nav className="flex flex-col gap-6 px-4 pt-12">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-6 mb-2">Your Space</p>
                    {libraryItems.map(({ label, icon: Icon, href }) => (
                        <Link
                            key={label}
                            href={href}
                            className="flex items-center gap-6 px-6 py-4 rounded-xl text-sm font-semibold text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-500 group"
                        >
                            <Icon className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" strokeWidth={1.5} />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Premium Promo */}
                <div className="mt-auto mx-6 mb-6 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[10px] font-black text-violet-500 mb-1 uppercase tracking-widest">Upgrade</p>
                    <p className="text-[10px] text-zinc-600 leading-relaxed font-medium">Access ad-free streaming & spatial audio.</p>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex justify-around items-center px-6 py-2 bg-zinc-950/80 backdrop-blur-2xl border border-white/5 h-[64px] rounded-3xl shadow-2xl overflow-hidden">
                {[
                    { label: 'Home', icon: Home, query: '' },
                    { label: 'Library', icon: Library, query: '__FAVORITES__' },
                ].map(({ label, icon: Icon, query }) => {
                    const href = query ? `/?q=${query}` : '/';
                    const isActive = pathname === href || (href !== '/' && pathname.includes(query));
                    return (
                        <Link key={label} href={href}
                            onClick={() => handleNavClick(query)}
                            className={`flex flex-col items-center gap-2 p-2 transition-all duration-500 w-fit group relative ${isActive ? 'text-[#8b5cf6]' : 'text-zinc-600 hover:text-zinc-400'}`}>
                            <Icon size={24} strokeWidth={1.5} className={isActive ? 'text-[#8b5cf6]' : ''} />
                            <span className="text-[9px] font-black tracking-widest uppercase opacity-70">{label}</span>
                            {isActive && <span className="absolute bottom-1 w-4 h-[2px] bg-[#8b5cf6] rounded-full" />}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
