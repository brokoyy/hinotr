import { SimplePool } from 'nostr-tools/pool';

export const pool = new SimplePool();

export const DEFAULT_RELAYS = [
  'wss://yabu.me',
  'wss://relay-jp.nostr.wirednet.jp',
  'wss://r.kojira.io',
  'wss://relay.damus.io',
  'wss://nos.lol',
];

const RELAY_STORAGE_KEY = 'hinotr_user_relays';

export const getStoredRelays = (): string[] => {
  try {
    const saved = localStorage.getItem(RELAY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('リレー設定の読み込みエラー:', e);
  }
  return DEFAULT_RELAYS;
};

export const saveStoredRelays = (relays: string[]) => {
  localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(relays));
  window.dispatchEvent(new Event('hinotr_relays_updated'));
};

export const loginWithNip07 = async (): Promise<string | null> => {
  if (typeof window === 'undefined' || !window.nostr) {
    alert('NIP-07 拡張機能（nos2x, Albyなど）が見つかりません。');
    return null;
  }
  try {
    const pubkey = await window.nostr.getPublicKey();
    return pubkey;
  } catch (e) {
    console.error('NIP-07 ログインエラー:', e);
    return null;
  }
};