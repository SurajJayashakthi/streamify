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
    const { searchQuery, setSearchQuery } = useVideoStore();

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
                className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[240px] z-40 bg-black border-r border-zinc-800/50"
            >
                {/* Logo Section */}
                <div className="flex items-center gap-4 px-10 py-10 h-16">
                    <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                    <span className="text-sm font-bold tracking-tight text-white leading-none">
                        Streamify
                    </span>
                </div>

                {/* Main Nav */}
                <nav className="flex flex-col gap-y-8 px-4">
                    {navItems.map(({ label, href, icon: Icon }) => {
                        const isActive = (href === '/' ? searchQuery !== '__FAVORITES__' : searchQuery === '__FAVORITES__');
                        return (
                            <Link
                                key={label}
                                href={href}
                                className={`flex items-center gap-6 py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-500 group relative border-l-4 ${isActive
                                    ? 'bg-white/5 text-[#8b5cf6] border-[#8b5cf6]'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5 border-transparent'
                                    }`}
                            >
                                <Icon
                                    size={24}
                                    className={`transition-colors shrink-0 ${isActive ? 'text-[#8b5cf6]' : 'text-zinc-500 group-hover:text-white'}`}
                                    strokeWidth={1.5}
                                />
                                <span className="truncate">{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Library Nav */}
                <nav className="flex flex-col gap-y-6 px-4 pt-12">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-6 mb-2">Your Space</p>
                    {libraryItems.map(({ label, icon: Icon, href }) => (
                        <Link
                            key={label}
                            href={href}
                            className="flex items-center gap-6 py-4 px-6 rounded-xl text-sm font-semibold text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-500 group border-l-4 border-transparent"
                        >
                            <Icon size={24} className="text-zinc-500 group-hover:text-white transition-colors shrink-0" strokeWidth={1.5} />
                            <span className="truncate">{label}</span>
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
            <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-4">
                <nav className="max-w-md mx-auto flex justify-center items-center px-4 py-2 bg-zinc-950/80 backdrop-blur-2xl border border-white/5 h-[72px] rounded-3xl shadow-2xl">
                    {[
                        { label: 'Home', icon: Home, query: '' },
                        { label: 'Library', icon: Library, query: '__FAVORITES__' },
                    ].map(({ label, icon: Icon, query }) => {
                        const href = query ? `/?q=${query}` : '/';
                        const isActive = pathname === href || (href !== '/' && pathname.includes(query));
                        return (
                            <Link key={label} href={href}
                                onClick={() => handleNavClick(query)}
                                className={`flex flex-col items-center gap-2 px-6 py-4 transition-all duration-500 w-fit group relative ${isActive ? 'text-[#8b5cf6]' : 'text-zinc-600 hover:text-zinc-400'}`}>
                                <Icon size={24} strokeWidth={1.5} className={isActive ? 'text-[#8b5cf6]' : ''} />
                                <span className="text-[9px] font-black tracking-widest uppercase opacity-70">{label}</span>
                                {isActive && <span className="absolute bottom-1 w-4 h-[2px] bg-[#8b5cf6] rounded-full" />}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
