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
  playHistory: YouTubeVideo[];
  setActiveVideo: (video: YouTubeVideo) => void;
  setSearchQuery: (query: string) => void;
  setIsPlayerOpen: (open: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setIsDrawerOpen: (open: boolean) => void;
  toggleFavorite: (video: YouTubeVideo) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setNextPageToken: (token: string | null) => void;
  popHistory: () => void;
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
  playHistory: [],
  setActiveVideo: (video) => set((state) => {
    // Only add to history if it's a new video
    const newHistory = state.activeVideo && state.activeVideo.id !== video.id 
      ? [...state.playHistory, state.activeVideo].slice(-50) // keep last 50
      : state.playHistory;
      
    return { 
      activeVideo: video, 
      isPlayerOpen: true, 
      isMinimized: false,
      playHistory: newHistory
    };
  }),
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
  popHistory: () => set((state) => {
    if (state.playHistory.length === 0) return state;
    const newHistory = [...state.playHistory];
    const previousVideo = newHistory.pop();
    if (!previousVideo) return state;
    
    return {
      activeVideo: previousVideo,
      playHistory: newHistory,
      isPlayerOpen: true,
      isMinimized: false
    };
  }),
}));
