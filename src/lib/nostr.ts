import { SimplePool } from 'nostr-tools/pool';

export const pool = new SimplePool();

export const DEFAULT_RELAYS = [
  'wss://yabu.me',
  'wss://relay-jp.nostr.wirednet.jp',
  'wss://r.kojira.io',
  'wss://relay.damus.io',
  'wss://nos.lol',
];

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