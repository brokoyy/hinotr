import { useState, useEffect, useMemo } from 'react';
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
  const [rawEvents, setRawEvents] = useState<NostrEvent[]>([]);
  const [targetEvents, setTargetEvents] = useState<Record<string, NostrEvent>>({});
  const [profiles, setProfiles] = useState<Record<string, UserProfileMeta>>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!pubkey) {
      setRawEvents([]);
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

          setRawEvents((prev) => {
            // 既に同じIDのイベントがあれば追加しない
            if (prev.some((n) => n.id === event.id)) return prev;
            return [event, ...prev];
          });

          // ターゲット投稿の取得
          const targetEventId = event.tags.find((tag) => tag[0] === 'e')?.[1];
          if (targetEventId && !targetEvents[targetEventId]) {
            pool.get(DEFAULT_RELAYS, { ids: [targetEventId] }).then((target) => {
              if (target) {
                setTargetEvents((prev) => ({ ...prev, [targetEventId]: target }));
              }
            }).catch(() => {});
          }

          // 送信者プロフィールの取得
          if (!profiles[event.pubkey]) {
            pool.get(DEFAULT_RELAYS, { kinds: [0], authors: [event.pubkey] }).then((profileEvent) => {
              if (profileEvent) {
                try {
                  const profile: UserProfileMeta = JSON.parse(profileEvent.content);
                  setProfiles((prev) => ({ ...prev, [event.pubkey]: profile }));
                } catch {}
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

  // rawEvents をもとに、Kind 6 と Kind 7 をターゲット単位でグループ化する
  const notifications = useMemo(() => {
    const map = new Map<string, NotificationItem>();

    // 古いものから新しいものへ順に処理していくことで、カウントを正しく積み上げる
    const sorted = [...rawEvents].sort((a, b) => a.created_at - b.created_at);

    for (const event of sorted) {
      const targetEventId = event.tags.find((tag) => tag[0] === 'e')?.[1];

      // リポスト(6) または リアクション(7) でターゲットがある場合は、
      // 「Kind + ターゲットID」をキーにして同じ投稿への反応を1つにまとめる
      const isAggregatable = (event.kind === 6 || event.kind === 7) && targetEventId;
      const groupKey = isAggregatable ? `${event.kind}-${targetEventId}` : `single-${event.id}`;

      if (map.has(groupKey)) {
        const existing = map.get(groupKey)!;
        const senders = existing.senders || [existing.pubkey];
        
        // まだこの送信者からの通知が追加されていなければ追加してカウントアップ
        if (!senders.includes(event.pubkey)) {
          senders.push(event.pubkey);
        }

        map.set(groupKey, {
          ...existing,
          count: senders.length,
          senders,
          // より新しいイベントの日時を全体のcreated_atにする
          created_at: Math.max(existing.created_at, event.created_at),
          targetEvent: targetEventId ? targetEvents[targetEventId] || existing.targetEvent : undefined,
          userProfile: profiles[event.pubkey] || existing.userProfile,
        });
      } else {
        map.set(groupKey, {
          ...event,
          count: 1,
          senders: [event.pubkey],
          targetEvent: targetEventId ? targetEvents[targetEventId] : undefined,
          userProfile: profiles[event.pubkey],
        });
      }
    }

    // 最終的に新しい順に並べ替えて返す
    return Array.from(map.values()).sort((a, b) => b.created_at - a.created_at);
  }, [rawEvents, targetEvents, profiles]);

  return { notifications, loading };
}
