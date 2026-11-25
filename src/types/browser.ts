export type SearchEngineKey = 'duckduckgo' | 'google' | 'bing';

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  historyStack: string[];
  historyIndex: number;
  zoom: number;
  isLoading: boolean;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  visitedAt: string;
}

export interface BrowserSettings {
  theme: 'light' | 'dark';
  searchEngine: SearchEngineKey;
  showBookmarksBar: boolean;
  homeUrl: string;
}
