'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVideoStore } from '@/store/useVideoStore';
import {
    Home, TrendingUp, Music2, Gamepad2, ThumbsUp, X, Zap
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
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                            <Zap className="w-4 h-4 text-white" fill="white" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">Streamify</span>
                    </div>
                    <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close drawer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-1 px-3 pt-6 flex-1 overflow-y-auto">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em] px-4 mb-3">Menu</p>
                    {navItems.map(({ label, icon: Icon, query }) => {
                        const href = query ? `/?q=${query}` : '/';
                        const isActive = pathname === href || (href !== '/' && pathname.includes(query));
                        return (
                            <Link
                                key={label}
                                href={href}
                                onClick={() => handleNavClick(query)}
                                className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-300 group ${isActive
                                    ? 'bg-indigo-500/10 text-indigo-400'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon
                                    className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-white'}`}
                                    strokeWidth={1.5}
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
