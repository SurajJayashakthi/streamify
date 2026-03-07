import { create } from 'zustand';

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  viewCount?: string;
  publishedAt?: string;
  description?: string;
}

interface VideoStore {
  activeVideo: YouTubeVideo | null;
  searchQuery: string;
  isPlayerOpen: boolean;
  isMinimized: boolean;
  isDrawerOpen: boolean;
  favorites: YouTubeVideo[];
  setActiveVideo: (video: YouTubeVideo) => void;
  setSearchQuery: (query: string) => void;
  setIsPlayerOpen: (open: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setIsDrawerOpen: (open: boolean) => void;
  toggleFavorite: (video: YouTubeVideo) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  activeVideo: null,
  searchQuery: 'lofi music chill beats',
  isPlayerOpen: false,
  isMinimized: false,
  isDrawerOpen: false,
  favorites: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('streamify_favorites') || '[]') : [],
  setActiveVideo: (video) => set({ activeVideo: video, isPlayerOpen: true, isMinimized: false }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsPlayerOpen: (open) => set({ isPlayerOpen: open }),
  setIsMinimized: (minimized) => set({ isMinimized: minimized }),
  setIsDrawerOpen: (open) => set({ isDrawerOpen: open }),
  toggleFavorite: (video) => set((state) => {
    const isFav = state.favorites.some((v) => v.id === video.id);
    const newFavorites = isFav
      ? state.favorites.filter((v) => v.id !== video.id)
      : [...state.favorites, video];

    if (typeof window !== 'undefined') {
      localStorage.setItem('streamify_favorites', JSON.stringify(newFavorites));
    }
    return { favorites: newFavorites };
  }),
}));
