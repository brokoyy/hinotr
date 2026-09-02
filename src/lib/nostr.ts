import { SimplePool } from 'nostr-tools';
import type { NostrEvent } from '../types/nostr';

// デフォルト接続用リレイ
export const DEFAULT_RELAYS = [
  'wss://r.kojira.io',
  'wss://relay-jp.nostr.wirednet.jp',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

export const pool = new SimplePool();

export async function loginWithNip07(): Promise<string | null> {
  if (!window.nostr) {
    alert('NIP-07拡張機能（nos2x, Albyなど）が見つかりません。');
    return null;
  }
  try {
    const pubkey = await window.nostr.getPublicKey();
    return pubkey;
  } catch (error) {
    console.error('ログインに失敗しました:', error);
    return null;
  }
}

// Kind 10002 から Read リレーを抽出
export function parseNip65Relays(event: NostrEvent): string[] {
  const readRelays: string[] = [];
  for (const tag of event.tags) {
    if (tag[0] === 'r' && tag[1]) {
      const url = tag[1];
      const marker = tag[2]; // 'read', 'write', または未指定
      if (!marker || marker === 'read') {
        readRelays.push(url);
      }
    }
  }
  return readRelays;
}