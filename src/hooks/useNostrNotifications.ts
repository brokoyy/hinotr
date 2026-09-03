import { useState, useEffect } from 'react';
import { SimplePool, Event as NostrEvent } from 'nostr-tools';

const DEFAULT_RELAYS = [
  'wss://relay-jp.nostr.wirednet.jp',
  'wss://relay.damus.io',
  'wss://nos.lol',
];

export interface NotificationItem {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  content: string;
  tags: string[][];
}

export function useNostrNotifications(pubkey: string | null) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!pubkey) {
      setNotifications([]);
      return;
    }

    const pool = new SimplePool();
    setLoading(true);

    const sub = pool.subscribeMany(
      DEFAULT_RELAYS,
      [
        {
          '#p': [pubkey],
          kinds: [1, 6, 7], // 1: リプライ/メンション, 6: リポスト, 7: リアクション
          limit: 50,
        },
      ],
      {
        onevent(event: NostrEvent) {
          // 自分自身の投稿に対するアクションは通知から除外する場合
          if (event.pubkey === pubkey) return;

          setNotifications((prev) => {
            // 重複チェック
            if (prev.some((n) => n.id === event.id)) return prev;
            // 新しい順にソート
            const updated = [event, ...prev];
            return updated.sort((a, b) => b.created_at - a.created_at);
          });
        },
        oneose() {
          setLoading(false);
        },
      }
    );

    return () => {
      sub.close();
      pool.close(DEFAULT_RELAYS);
    };
  }, [pubkey]);

  return { notifications, loading };
}
