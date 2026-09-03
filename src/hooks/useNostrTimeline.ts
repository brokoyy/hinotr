import { useState, useEffect } from 'react';
import type { NostrEvent, AppMode, TimelinePost } from '../types/nostr';
import { pool, DEFAULT_RELAYS, parseNip65Relays } from '../lib/nostr';

export interface UserProfile {
  picture?: string;
  name?: string;
}

// リレー用のストレージキー
const STORAGE_KEY_RELAYS = 'hinotr_relays';

export function useNostrTimeline(pubkey: string | null, mode: AppMode) {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [follows, setFollows] = useState<string[]>([]);
  
  // 1. 初回からlocalStorageのリレー（またはデフォルト）を初期値にする
  const [relays, setRelays] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RELAYS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // 読み込み失敗時はフォールバック
    }
    return DEFAULT_RELAYS;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 2. NIP-65 リレーリスト & ユーザープロフィールの取得
  useEffect(() => {
    let isMounted = true;

    if (!pubkey) {
      setUserProfile(null);
      return;
    }

    const fetchUserData = async () => {
      try {
        const searchTarget = Array.from(new Set([...DEFAULT_RELAYS, 'wss://purplepag.es']));
        
        // リレーリスト取得 (Kind 10002)
        const relayEvents = await pool.querySync(searchTarget, {
          kinds: [10002],
          authors: [pubkey],
          limit: 1,
        });

        if (isMounted && relayEvents.length > 0) {
          const userRelays = parseNip65Relays(relayEvents[0]);
          if (userRelays.length > 0) {
            setRelays(userRelays);
            // 次回のためにローカルストレージに保存
            localStorage.setItem(STORAGE_KEY_RELAYS, JSON.stringify(userRelays));
          }
        }

        // プロフィール取得 (Kind 0)
        const profileEvents = await pool.querySync(searchTarget, {
          kinds: [0],
          authors: [pubkey],
          limit: 1,
        });

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

    return () => {
      isMounted = false;
    };
  }, [pubkey]);

  // 3. フォローリスト取得 (Kind 3)
  useEffect(() => {
    let isMounted = true;

    if (!pubkey) {
      setFollows([]);
      return;
    }

    const fetchFollows = async () => {
      setLoading(true);
      try {
        const targetRelays = Array.from(new Set([...relays, 'wss://purplepag.es']));
        const events = await pool.querySync(targetRelays, {
          kinds: [3],
          authors: [pubkey],
          limit: 1,
        });

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

    return () => {
      isMounted = false;
    };
  }, [pubkey, relays]);

  // 4. タイムラインの取得（フォローリストの確定を待ち、PHANTOM時は最初から10分以内に絞る）
  useEffect(() => {
    let isMounted = true;

    if (!pubkey || follows.length === 0) {
      if (pubkey && follows.length === 0) {
        setLoading(true);
      } else {
        setPosts([]);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setPosts([]);

    const now = Math.floor(Date.now() / 1000);
    let filter: any = {};

    if (mode === 'PHANTOM') {
      const tenMinutesAgo = now - 600;
      filter = { kinds: [1], since: tenMinutesAgo, limit: 50, authors: follows };
    } else {
      const ONE_YEAR = 365 * 24 * 60 * 60;
      const SIX_HOURS = 6 * 60 * 60;
      const oneYearAgoNow = now - ONE_YEAR;

      filter = {
        kinds: [1],
        since: oneYearAgoNow - SIX_HOURS,
        until: oneYearAgoNow,
        limit: 200,
        authors: follows,
      };
    }

    const fetchPosts = async () => {
      try {
        const fetchedEvents = (await pool.querySync(relays, filter)) as NostrEvent[];
        if (isMounted) {
          const currentTime = Math.floor(Date.now() / 1000);
          
          // PHANTOMモード時は取得データ側でも念のため10分以内のものだけに厳密に絞り込む
          const processedEvents = mode === 'PHANTOM'
            ? fetchedEvents.filter((post) => currentTime - post.created_at < 600)
            : fetchedEvents;

          const sorted = processedEvents.sort((a, b) => b.created_at - a.created_at);
          setPosts(sorted);
        }
      } catch (e) {
        console.error('投稿の取得失敗:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPosts();

    if (mode === 'PHANTOM') {
      const sub = pool.subscribeMany(relays, filter, {
        onevent(event: NostrEvent) {
          if (!isMounted) return;
          const currentTime = Math.floor(Date.now() / 1000);
          if (currentTime - event.created_at >= 600) return; // 10分以上古いものはリアルタイム追加しない

          setPosts((prev) => {
            if (prev.some((p) => p.id === event.id)) return prev;
            return [event, ...prev].sort((a, b) => b.created_at - a.created_at);
          });
        },
      });

      return () => {
        isMounted = false;
        sub.close();
      };
    }
  }, [follows, mode, pubkey, relays]);

  // PHANTOMタイマー
  useEffect(() => {
    if (mode !== 'PHANTOM') return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);

      setPosts((prevPosts) =>
        prevPosts
          .filter((post) => now - post.created_at < 600)
          .map((post) => ({
            ...post,
            isFading: now - post.created_at >= 540,
          }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [mode]);

  return { posts, loading, relays, userProfile };
}