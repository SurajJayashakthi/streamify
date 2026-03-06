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
  setActiveVideo: (video: YouTubeVideo) => void;
  setSearchQuery: (query: string) => void;
  setIsPlayerOpen: (open: boolean) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  activeVideo: null,
  searchQuery: 'lofi music chill beats',
  isPlayerOpen: false,
  setActiveVideo: (video) => set({ activeVideo: video, isPlayerOpen: true }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsPlayerOpen: (open) => set({ isPlayerOpen: open }),
}));
