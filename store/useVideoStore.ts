import { create } from 'zustand';

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  viewCount?: string;
  publishedAt?: string;
  duration?: string;
  description?: string;
}

interface VideoStore {
  activeVideo: YouTubeVideo | null;
  searchQuery: string;
  isPlayerOpen: boolean;
  isMinimized: boolean;
  isDrawerOpen: boolean;
  favorites: YouTubeVideo[];
  autoPlay: boolean;
  nextPageToken: string | null;
  setActiveVideo: (video: YouTubeVideo) => void;
  setSearchQuery: (query: string) => void;
  setIsPlayerOpen: (open: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setIsDrawerOpen: (open: boolean) => void;
  toggleFavorite: (video: YouTubeVideo) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setNextPageToken: (token: string | null) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  activeVideo: null,
  searchQuery: '__HOME__',
  isPlayerOpen: false,
  isMinimized: false,
  isDrawerOpen: false,
  favorites: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('streamify_favorites') || '[]') : [],
  autoPlay: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('streamify_autoplay') || 'true') : true,
  nextPageToken: null,
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
  setAutoPlay: (autoPlay) => set((state) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('streamify_autoplay', JSON.stringify(autoPlay));
    }
    return { autoPlay };
  }),
  setNextPageToken: (token) => set({ nextPageToken: token }),
}));
