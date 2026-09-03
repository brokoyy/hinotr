import { useState, useEffect } from 'react';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { SimplePool } from 'nostr-tools';
import { DEFAULT_RELAYS } from '../lib/nostr';

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

    const filter: Filter = {
      '#p': [pubkey],
      kinds: [1, 6, 7],
      limit: 50,
    };

    const sub = pool.subscribeMany(
      DEFAULT_RELAYS,
      filter, // 配列ではなく単体の Filter オブジェクトとして渡す
      {
        onevent(event: NostrEvent) {
          if (event.pubkey === pubkey) return;

          setNotifications((prev) => {
            if (prev.some((n) => n.id === event.id)) return prev;
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
