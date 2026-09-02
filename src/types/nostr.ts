export type AppMode = 'PHANTOM' | 'HINOTORI';

export type Theme = 'light' | 'dark';

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface TimelinePost extends NostrEvent {
  isFading?: boolean;
}