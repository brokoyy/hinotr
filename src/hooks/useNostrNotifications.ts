import { useState, useEffect } from 'react';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { SimplePool } from 'nostr-tools';
import { DEFAULT_RELAYS } from '../lib/nostr';

export interface NotificationItem extends NostrEvent {
  // 必要に応じてカスタムプロパティを追加可能
  targetEvent?: NostrEvent; // 対象となった元の投稿データ
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
      filter,
      {
        onevent(event: NostrEvent) {
          if (event.pubkey === pubkey) return;

          // 1. 通知イベントが参照している親ポストのID（eタグ）を抽出する
          const targetEventId = event.tags.find(
            (tag) => tag[0] === 'e'
          )?.[1];

          // 2. まずは通知アイテム自体をリストに追加
          setNotifications((prev) => {
            if (prev.some((n) => n.id === event.id)) return prev;
            const updated = [event, ...prev];
            return updated.sort((a, b) => b.created_at - a.created_at);
          });

          // 3. 参照先の親ポストがある場合、リレーからその親ポストのデータを取得して結びつける
          if (targetEventId) {
            pool.get(DEFAULT_RELAYS, { ids: [targetEventId] }).then((targetEvent) => {
              if (targetEvent) {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === event.id ? { ...n, targetEvent } : n
                  )
                );
              }
            }).catch(() => {});
          }
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
