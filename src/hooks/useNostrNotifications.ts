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
  userProfile?: UserProfileMeta;
  count?: number;
  senders?: string[];
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

          setNotifications((prev) => {
            // 既に存在していれば追加しない
            if (prev.some((n) => n.id === event.id)) return prev;

            const targetEventId = event.tags.find((tag) => tag[0] === 'e')?.[1];

            // Kind 6(リポスト) または Kind 7(リアクション) で、ターゲットがある場合は集約を試みる
            if ((event.kind === 6 || event.kind === 7) && targetEventId) {
              const existingIndex = prev.findIndex(
                (n) => n.kind === event.kind &&
                n.tags.find((t) => t[0] === 'e')?.[1] === targetEventId
              );

              if (existingIndex !== -1) {
                const target = prev[existingIndex];
                const senders = target.senders || [target.pubkey];
                if (!senders.includes(event.pubkey)) {
                  senders.push(event.pubkey);
                }

                const updatedList = [...prev];
                updatedList[existingIndex] = {
                  ...target,
                  count: senders.length,
                  senders,
                  created_at: Math.max(target.created_at, event.created_at),
                  userProfile: target.userProfile, // 直近のプロフィールを保持
                };
                return updatedList.sort((a, b) => b.created_at - a.created_at);
              }
            }

            // 新規アイテムとして追加
            const newItem: NotificationItem = {
              ...event,
              count: 1,
              senders: [event.pubkey],
            };
            return [newItem, ...prev].sort((a, b) => b.created_at - a.created_at);
          });

          // 親ポストの取得
          const targetEventId = event.tags.find((tag) => tag[0] === 'e')?.[1];
          if (targetEventId) {
            pool.get(DEFAULT_RELAYS, { ids: [targetEventId] }).then((targetEvent) => {
              if (targetEvent) {
                setNotifications((prev) =>
                  prev.map((n) => {
                    const nTargetId = n.tags.find((t) => t[0] === 'e')?.[1];
                    return nTargetId === targetEventId ? { ...n, targetEvent } : n;
                  })
                );
              }
            }).catch(() => {});
          }

          // 送信者のプロフィール取得
          pool.get(DEFAULT_RELAYS, { kinds: [0], authors: [event.pubkey] }).then((profileEvent) => {
            if (profileEvent) {
              try {
                const profile: UserProfileMeta = JSON.parse(profileEvent.content);
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.pubkey === event.pubkey || (n.senders && n.senders.includes(event.pubkey))
                      ? { ...n, userProfile: profile }
                      : n
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
