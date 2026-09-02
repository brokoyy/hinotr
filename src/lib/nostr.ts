import { SimplePool } from 'nostr-tools';

// デフォルト接続用リレイ（日本の主要リレイなど）
export const DEFAULT_RELAYS = [
  'wss://relay-jp.nostr.wirednet.jp',
  'wss://r.kojira.io',
  'wss://yabu.me',
  'wss://nos.lol',
];

// SimplePoolのインスタンス作成
export const pool = new SimplePool();

// NIP-07によるログイン処理
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
