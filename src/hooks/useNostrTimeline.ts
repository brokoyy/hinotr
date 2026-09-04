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

  // NIP-65 リレーリスト & ユーザープロフィールの取得
  useEffect(() => {
    let isMounted = true;
    if (!pubkey) {
      setUserProfile(null);
      return;
    }

    const fetchUserData = async () => {
      try {
        const searchTarget = Array.from(new Set([...DEFAULT_RELAYS, 'wss://relay-jp.nostr.wirednet.jp']));
        
        const relayEvents = await pool.querySync(searchTarget, {
          kinds: [10002],
          authors: [pubkey],
          limit: 1,
        } as any);

        if (isMounted && relayEvents.length > 0) {
          const userRelays = parseNip65Relays(relayEvents[0]);
          if (userRelays.length > 0) {
            setRelays(userRelays);
            localStorage.setItem(STORAGE_KEY_RELAYS, JSON.stringify(userRelays));
          }
        }

        const profileEvents = await pool.querySync(searchTarget, {
          kinds: [0],
          authors: [pubkey],
          limit: 1,
        } as any);

        if (isMounted && profileEvents.length > 0) {
          const metadata = JSON.parse(profileEvents[0].content);
          setUserProfile({
            picture: metadata.picture,
            name: metadata.display_name || metadata.name,
          });
        }
      } catch (e) {
        console.error('ユーザーデータの取得失敗:', e);
      }
    };

    fetchUserData();
    return () => { isMounted = false; };
  }, [pubkey]);

  // フォローリスト取得 (Kind 3)
  useEffect(() => {
    let isMounted = true;
    if (!pubkey) {
      setFollows([]);
      return;
    }

    const fetchFollows = async () => {
      try {
        const targetRelays = Array.from(new Set([...relays, 'wss://purplepag.es']));
        const events = await pool.querySync(targetRelays, {
          kinds: [3],
          authors: [pubkey],
          limit: 1,
        } as any);

        if (isMounted) {
          if (events.length > 0) {
            const followPubkeys = events[0].tags
              .filter((tag) => tag[0] === 'p')
              .map((tag) => tag[1]);
            setFollows([...followPubkeys, pubkey]);
          } else {
            setFollows([pubkey]);
          }
        }
      } catch (error) {
        console.error('フォローリストの取得に失敗:', error);
        if (isMounted) setFollows([pubkey]);
      }
    };

    fetchFollows();
    return () => { isMounted = false; };
  }, [pubkey, relays]);

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
        const rawPosts = (await pool.querySync(relays, filter)) as NostrEvent[];
        if (isMounted) {
          const currentTime = Math.floor(Date.now() / 1000);

          const processedEvents = mode === 'PHANTOM'
            ? rawPosts.filter((post) => currentTime - post.created_at < 600)
            : rawPosts;

          const postIds = new Set(processedEvents.map((p) => p.id));

          // リアクション (Kind 7) の取得
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
      const sub = pool.subscribeMany(relays, [filter], {
        onevent(event: NostrEvent) {
          if (!isMounted) return;

          if (event.kind === 1) {
            setPosts((prev) => {
              const currentTime = Math.floor(Date.now() / 1000);
              if (currentTime - event.created_at >= 600) return prev;
              if (prev.some((p) => p.id === event.id)) return prev;

              const updated = [{ ...event, reactions: [] }, ...prev].sort((a, b) => b.created_at - a.created_at) as TimelinePost[];
              localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(updated));
              return updated;
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

  // PHANTOMのタイマー
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

  return { posts, loading, relays, userProfile };
}
