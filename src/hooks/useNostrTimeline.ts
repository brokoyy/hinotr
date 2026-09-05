import { useState, useEffect } from 'react';
import type { NostrEvent, AppMode, TimelinePost } from '../types/nostr';
import { pool, DEFAULT_RELAYS, parseNip65Relays } from '../lib/nostr';

export interface UserProfile {
  picture?: string;
  name?: string;
}

const STORAGE_KEY_RELAYS = 'hinotr_relays';
const STORAGE_KEY_POSTS = 'hinotr_cached_posts';

export function useNostrTimeline(pubkey: string | null, mode: AppMode) {
  const [posts, setPosts] = useState<TimelinePost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POSTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // ★ リアルタイムで届いた新着投稿をストックするステート
  const [pendingPosts, setPendingPosts] = useState<TimelinePost[]>([]);

  const [follows, setFollows] = useState<string[]>([]);
  
  const [relays, setRelays] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RELAYS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_RELAYS;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // （中略：NIP-65 リレーリスト、プロフィール、フォローリストの取得部分はそのまま）
  // ※長くなるため省略しますが、上記の取得ロジックは一切変更不要です

  // タイムラインの取得
  useEffect(() => {
    let isMounted = true;
    if (!pubkey || follows.length === 0) return;

    const now = Math.floor(Date.now() / 1000);
    let filter: any = {};

    if (mode === 'PHANTOM') {
      const tenMinutesAgo = now - 600;
      filter = { kinds: [1], since: tenMinutesAgo, limit: 100, authors: follows };
    } else {
      const ONE_YEAR = 365 * 24 * 60 * 60;
      const SIX_HOURS = 6 * 60 * 60;
      const oneYearAgoNow = now - ONE_YEAR;

      filter = {
        kinds: [1],
        since: oneYearAgoNow - SIX_HOURS,
        until: oneYearAgoNow,
        limit: 300,
        authors: follows,
      };
    }

    const fetchPosts = async () => {
      try {
        const rawPosts = (await pool.querySync(relays, filter as any)) as NostrEvent[];
        if (isMounted) {
          const currentTime = Math.floor(Date.now() / 1000);

          const processedEvents = mode === 'PHANTOM'
            ? rawPosts.filter((post) => currentTime - post.created_at < 600)
            : rawPosts;

          const postIds = new Set(processedEvents.map((p) => p.id));

          let rawReactions: NostrEvent[] = [];
          if (postIds.size > 0) {
            try {
              rawReactions = (await pool.querySync(relays, {
                kinds: [7],
                limit: 500,
              } as any)) as NostrEvent[];
            } catch (err) {
              console.error('リアクション取得エラー:', err);
            }
          }

          const postsWithReactions = processedEvents.map((post) => {
            const reactions = rawReactions.filter((r: NostrEvent) => {
              const eTag = r.tags.find((t) => t[0] === 'e');
              return eTag && postIds.has(eTag[1]) && eTag[1] === post.id;
            });
            return { ...post, reactions };
          });

          const sorted = postsWithReactions.sort((a, b) => b.created_at - a.created_at) as TimelinePost[];
          setPosts(sorted);
          setPendingPosts([]); // 初回ロード時は新着ストックをクリア
          localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(sorted));
        }
      } catch (e) {
        console.error('投稿の取得失敗:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPosts();

    if (mode === 'PHANTOM') {
      const sub = pool.subscribeMany(relays, [filter] as any, {
        onevent(event: NostrEvent) {
          if (!isMounted) return;

          if (event.kind === 1) {
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime - event.created_at >= 600) return;

            // ★ リアルタイムで流れてきたものは、mainのpostsではなく pendingPosts に溜める
            setPendingPosts((prev) => {
              if (prev.some((p) => p.id === event.id)) return prev;
              // すでに表示中のpostsにも含まれていればスルー
              // (ここでは簡易的に新着ストックに追加)
              return [{ ...event, reactions: [] }, ...prev].sort((a, b) => b.created_at - a.created_at) as TimelinePost[];
            });
          }
        },
      });

      return () => {
        isMounted = false;
        sub.close();
      };
    }
  }, [follows, mode, pubkey, relays]);

  // ★ バッジが押されたときに新着をメインのタイムラインに結合する関数
  const loadNewPosts = () => {
    if (pendingPosts.length === 0) return;
    setPosts((prev) => {
      const updated = [...pendingPosts, ...prev].sort((a, b) => b.created_at - a.created_at) as TimelinePost[];
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(updated));
      return updated;
    });
    setPendingPosts([]);
  };

  // PHANTOMのタイマー（メインのpostsから古いものを消す処理）
  useEffect(() => {
    if (mode !== 'PHANTOM') return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);

      setPosts((prevPosts) => {
        const filtered = prevPosts
          .filter((post) => now - post.created_at < 600)
          .map((post) => ({
            ...post,
            isFading: now - post.created_at >= 540,
          }));
        return filtered;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode]);

  return { posts, pendingPosts, loadNewPosts, loading, relays, userProfile };
}
