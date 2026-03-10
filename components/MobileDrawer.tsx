'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVideoStore } from '@/store/useVideoStore';
import {
    Home, TrendingUp, Music2, Gamepad2, ThumbsUp, X, Sparkles
} from 'lucide-react';
import { useEffect } from 'react';

const navItems = [
    { label: 'Home', icon: Home, query: '' },
    { label: 'Trending', icon: TrendingUp, query: 'trending' },
    { label: 'Music', icon: Music2, query: 'music' },
    { label: 'Gaming', icon: Gamepad2, query: 'gaming' },
    { label: 'Favorites', icon: ThumbsUp, query: '__FAVORITES__' },
];

export default function MobileDrawer() {
    const { isDrawerOpen, setIsDrawerOpen, setSearchQuery } = useVideoStore();
    const pathname = usePathname();

    const handleNavClick = (query: string) => {
        if (query) {
            setSearchQuery(query);
        } else {
            setSearchQuery('lofi music chill beats');
        }
        setIsDrawerOpen(false);
    };

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isDrawerOpen]);

    if (!isDrawerOpen) return null;

    return (
        <div className="md:hidden fixed inset-0 z-[100]">
            {/* Backdrop overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsDrawerOpen(false)}
            />

            {/* Sliding Drawer */}
            <div
                className="absolute left-0 top-0 bottom-0 w-[260px] flex flex-col shadow-2xl transition-transform transform translate-x-0"
                style={{ background: 'rgba(9,9,11,0.98)', borderRight: '1px solid rgba(168,85,247,0.15)' }}
            >
                <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-800/50">
                    <div className="flex items-center gap-4">
                        <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                        <span className="text-lg font-bold text-white tracking-tight">Streamify</span>
                    </div>
                    <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close drawer"
                    >
                        <X size={24} strokeWidth={2} />
                    </button>
                </div>

                <nav className="flex flex-col gap-2 px-4 pt-8 flex-1 overflow-y-auto">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest px-4 mb-4">Menu</p>
                    {navItems.map(({ label, icon: Icon, query }) => {
                        const href = query ? `/?q=${query}` : '/';
                        const isActive = pathname === href || (href !== '/' && pathname.includes(query));
                        return (
                            <Link
                                key={label}
                                href={href}
                                onClick={() => handleNavClick(query)}
                                className={`flex items-center gap-5 px-5 py-4 rounded-xl text-sm font-semibold transition-all duration-300 group ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon
                                    className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`}
                                    strokeWidth={isActive ? 2 : 1.5}
                                />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-5 border-t border-white/5 mt-auto">
                    <p className="text-xs text-zinc-500 text-center">Streamify PRO &copy; 2026</p>
                </div>
            </div>
        </div>
    );
}
