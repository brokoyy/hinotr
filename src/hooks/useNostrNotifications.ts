import { useState, useEffect } from 'react';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { SimplePool } from 'nostr-tools';
import { DEFAULT_RELAYS } from '../lib/nostr';

export interface UserProfileMeta {
  name?: string;
  display_name?: string;
  picture?: string;
}

export interface NotificationItem extends NostrEvent {
  targetEvent?: NostrEvent;
  userProfile?: UserProfileMeta; // 送信者のプロフィール
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

          const targetEventId = event.tags.find(
            (tag) => tag[0] === 'e'
          )?.[1];

          // 1. まず通知イベントを追加
          setNotifications((prev) => {
            if (prev.some((n) => n.id === event.id)) return prev;
            const updated = [event, ...prev];
            return updated.sort((a, b) => b.created_at - a.created_at);
          });

          // 2. 参照先の親ポストを取得
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

          // 3. 送信者のプロフィール（Kind 0）を取得
          pool.get(DEFAULT_RELAYS, { kinds: [0], authors: [event.pubkey] }).then((profileEvent) => {
            if (profileEvent) {
              try {
                const profile: UserProfileMeta = JSON.parse(profileEvent.content);
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.pubkey === event.pubkey ? { ...n, userProfile: profile } : n
                  )
                );
              } catch {}
            }
          }).catch(() => {});
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
