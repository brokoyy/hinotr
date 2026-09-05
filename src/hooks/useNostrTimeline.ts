import { useState, useEffect, useRef } from 'react';
import type { NostrEvent, AppMode, TimelinePost } from '../types/nostr';
import { pool, DEFAULT_RELAYS } from '../lib/nostr';

export interface UserProfile {
  picture?: string;
  name?: string;
}

const STORAGE_KEY_RELAYS = 'hinotr_relays';
const STORAGE_KEY_POSTS_PHANTOM = 'hinotr_cached_posts_phantom';
const STORAGE_KEY_POSTS_HINOTORI = 'hinotr_cached_posts_hinotori';

export function useNostrTimeline(pubkey: string | null, mode: AppMode) {
  // モードごとに独立したキャッシュを持つ
  const [phantomPosts, setPhantomPosts] = useState<TimelinePost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POSTS_PHANTOM);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [hinotoriPosts, setHinotoriPosts] = useState<TimelinePost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POSTS_HINOTORI);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 現在のモードに応じたpostsを返す
  const posts = mode === 'PHANTOM' ? phantomPosts : hinotoriPosts;
  const setPosts = mode === 'PHANTOM' ? setPhantomPosts : setHinotoriPosts;

  const [pendingPosts, setPendingPosts] = useState<TimelinePost[]>([]);
  const [follows, setFollows] = useState<string[]>([]);
  
  const [relays] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RELAYS);
      if (saved) {
        const parsedRelays = JSON.parse(saved);
        if (Array.isArray(parsedRelays) && parsedRelays.length > 0) return parsedRelays;
      }
    } catch (e) {}
    return DEFAULT_RELAYS;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [, setLoading] = useState<boolean>(false);

  // 初回フェッチ済みフラグ（モード切替ごとの無駄な重複フェッチを防ぐ）
  const fetchedModes = useRef<{ [key in AppMode]?: boolean }>({});

  // 1. ユーザープロフィールの取得
  useEffect(() => {
    let isMounted = true;
    if (!pubkey) {
      setUserProfile(null);
      return;
    }

    const fetchUserData = async () => {
      try {
        const searchTarget = Array.from(new Set([...DEFAULT_RELAYS, 'wss://relay-jp.nostr.wirednet.jp']));
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

  // 2. フォローリスト取得 (Kind 3)
  useEffect(() => {
    let isMounted = true;
    if (!pubkey) {
      setFollows([]);
      return;
    }

    setFollows([pubkey]);

    const fetchFollows = async () => {
      try {
        const targetRelays = Array.from(new Set([...relays, 'wss://purplepag.es']));
        const events = await pool.querySync(targetRelays, {
          kinds: [3],
          authors: [pubkey],
          limit: 1,
        } as any);

        if (isMounted && events.length > 0) {
          const followPubkeys = events[0].tags
            .filter((tag) => tag[0] === 'p')
            .map((tag) => tag[1]);
          if (followPubkeys.length > 0) {
            setFollows([...followPubkeys, pubkey]);
          }
        }
      } catch (error) {
        console.error('フォローリストの取得に失敗:', error);
      }
    };

    fetchFollows();
    return () => { isMounted = false; };
  }, [pubkey, relays]);

  // 3. メインのタイムライン取得（モードが切り替わったとき、まだそのモードのデータを取得していなければフェッチする）
  useEffect(() => {
    let isMounted = true;
    if (!pubkey) return;

    const now = Math.floor(Date.now() / 1000);
    let filter: any = {};
    const targetAuthors = follows.length > 0 ? follows : [pubkey];

    if (mode === 'PHANTOM') {
      const tenMinutesAgo = now - 600;
      filter = { kinds: [1], since: tenMinutesAgo, limit: 100, authors: targetAuthors };
    } else {
      const ONE_YEAR = 365 * 24 * 60 * 60;
      const SIX_HOURS = 6 * 60 * 60;
      const oneYearAgoNow = now - ONE_YEAR;

      filter = {
        kinds: [1],
        since: oneYearAgoNow - SIX_HOURS,
        until: oneYearAgoNow,
        limit: 300,
        authors: targetAuthors,
      };
    }

    const fetchPosts = async () => {
      // すでにキャッシュや描画データがあり、このセッションで一度取得していれば再フェッチをスキップしてサクサク動かす
      if (fetchedModes.current[mode]) return;

      setLoading(true);
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
          if (sorted.length > 0) {
            if (mode === 'PHANTOM') {
              setPhantomPosts(sorted);
              localStorage.setItem(STORAGE_KEY_POSTS_PHANTOM, JSON.stringify(sorted));
            } else {
              setHinotoriPosts(sorted);
              localStorage.setItem(STORAGE_KEY_POSTS_HINOTORI, JSON.stringify(sorted));
            }
          }
          fetchedModes.current[mode] = true;
          setPendingPosts([]);
        }
      } catch (e) {
        console.error('投稿の取得失敗:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPosts();

    // 4. PHANTOMモード時のリアルタイムポーリング
    if (mode === 'PHANTOM') {
      const intervalId = setInterval(async () => {
        if (!isMounted) return;
        try {
          const latestQueryTime = Math.floor(Date.now() / 1000) - 600;
          const newRawPosts = (await pool.querySync(relays, {
            kinds: [1],
            since: latestQueryTime,
            limit: 30,
            authors: targetAuthors,
          } as any)) as NostrEvent[];

          if (!isMounted || newRawPosts.length === 0) return;

          setPhantomPosts((currentPosts) => {
            const existingIds = new Set([...currentPosts.map((p) => p.id), ...pendingPosts.map((p) => p.id)]);
            
            const brandNew = newRawPosts.filter((p) => !existingIds.has(p.id));
            if (brandNew.length === 0) return currentPosts;

            const currentTime = Math.floor(Date.now() / 1000);
            const validNew = brandNew.filter((p) => currentTime - p.created_at < 600);

            if (validNew.length > 0) {
              setPendingPosts((prev) => {
                const prevIds = new Set(prev.map((p) => p.id));
                const uniqueNew = validNew.filter((p) => !prevIds.has(p.id));
                if (uniqueNew.length === 0) return prev;
                
                const formatted = uniqueNew.map((p) => ({ ...p, reactions: [] })) as TimelinePost[];
                return [...formatted, ...prev].sort((a, b) => b.created_at - a.created_at);
              });
            }

            return currentPosts;
          });
        } catch (err) {
          console.error('バックグラウンド更新エラー:', err);
        }
      }, 10000);

      return () => {
        isMounted = false;
        clearInterval(intervalId);
      };
    }
  }, [follows, mode, pubkey, relays, pendingPosts]);

  const loadNewPosts = () => {
    if (pendingPosts.length === 0) return;
    setPhantomPosts((prev) => {
      const updated = [...pendingPosts, ...prev].sort((a, b) => b.created_at - a.created_at) as TimelinePost[];
      localStorage.setItem(STORAGE_KEY_POSTS_PHANTOM, JSON.stringify(updated));
      return updated;
    });
    setPendingPosts([]);
  };

  // PHANTOMのタイマー（古い投稿を消す）
  useEffect(() => {
    if (mode !== 'PHANTOM') return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);

      setPhantomPosts((prevPosts) => {
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

  return { posts, pendingPosts, loadNewPosts, relays, userProfile };
}
