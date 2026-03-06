'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Search,
    Library,
    TrendingUp,
    Music2,
    Gamepad2,
    ThumbsUp,
    Radio,
    Podcast,
    ListMusic,
    Zap,
} from 'lucide-react';

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

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[240px] z-40 overflow-y-auto"
                style={{ background: 'rgba(9,9,11,0.95)', borderRight: '1px solid rgba(168,85,247,0.12)' }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                        <Zap className="w-5 h-5 text-white" fill="white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">
                        Streamify
                    </span>
                </div>

                {/* Main Nav */}
                <nav className="flex flex-col gap-1 px-3 pt-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">Menu</p>
                    {navItems.map(({ label, icon: Icon, href }) => {
                        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
                        return (
                            <Link
                                key={label}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon
                                    className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-white'}`}
                                    size={18}
                                />
                                {label}
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Library Nav */}
                <nav className="flex flex-col gap-1 px-3 pt-6">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">Library</p>
                    {libraryItems.map(({ label, icon: Icon, href }) => (
                        <Link
                            key={label}
                            href={href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                        >
                            <Icon className="w-4.5 h-4.5 text-zinc-500 group-hover:text-white transition-colors" size={18} />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Bottom promo */}
                <div className="mt-auto mx-3 mb-4 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(124,58,237,0.1))', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <p className="text-xs font-semibold text-purple-300 mb-1">✨ Go Premium</p>
                    <p className="text-xs text-zinc-500">Unlimited streams, no ads.</p>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 py-2 bg-zinc-950/95 backdrop-blur-xl border-t border-purple-500/15 h-[60px] pb-safe">
                {[
                    { label: 'Home', icon: Home, href: '/' },
                    { label: 'Search', icon: Search, href: '/?q=trending' }, // Placeholder for search focus
                    { label: 'Library', icon: Library, href: '/?q=playlists' },
                ].map(({ label, icon: Icon, href }) => {
                    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
                    return (
                        <Link key={label} href={href}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
                            <Icon size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''} />
                            <span className="text-[10px] font-medium tracking-wide">{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
