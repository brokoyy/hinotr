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
}

// 確実に対象の投稿ID（eタグ）を抽出するヘルパー関数
function getTargetEventId(event: NostrEvent): string | undefined {
  const eTags = event.tags.filter((tag) => tag[0] === 'e');
  if (eTags.length === 0) return undefined;
  const targetTag = eTags[eTags.length - 1];
  return targetTag ? targetTag[1] : undefined;
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
            if (prev.some((n) => n.id === event.id)) return prev;
            return [event, ...prev];
          });

          // ターゲット投稿の取得
          const targetEventId = getTargetEventId(event);
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

  // グループ化を行わず、受信した通知イベントを個別にリスト化して新しい順にソートする
  const notifications: NotificationItem[] = useMemo(() => {
    return rawEvents
      .map((event) => {
        const targetEventId = getTargetEventId(event);
        return {
          ...event,
          targetEvent: targetEventId ? targetEvents[targetEventId] : undefined,
          userProfile: profiles[event.pubkey],
        };
      })
      .sort((a, b) => b.created_at - a.created_at);
  }, [rawEvents, targetEvents, profiles]);

  return { notifications, loading };
}
