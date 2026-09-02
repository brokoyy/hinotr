import { useState, useEffect } from 'react';
import type { NostrEvent, AppMode, TimelinePost } from '../types/nostr';
import { pool, DEFAULT_RELAYS, parseNip65Relays } from '../lib/nostr';

export function useNostrTimeline(pubkey: string | null, mode: AppMode) {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [follows, setFollows] = useState<string[]>([]);
  const [relays, setRelays] = useState<string[]>(DEFAULT_RELAYS);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. NIP-65 (Kind 10002) リレーリストの取得
  useEffect(() => {
    let isMounted = true;

    if (!pubkey) {
      setRelays(DEFAULT_RELAYS);
      return;
    }

    const fetchUserRelays = async () => {
      try {
        const searchTarget = Array.from(new Set([...DEFAULT_RELAYS, 'wss://purplepag.es']));
        const events = await pool.querySync(searchTarget, {
          kinds: [10002],
          authors: [pubkey],
          limit: 1,
        });

        if (isMounted && events.length > 0) {
          const userRelays = parseNip65Relays(events[0]);
          if (userRelays.length > 0) {
            console.log('NIP-65リレー設定を適用:', userRelays);
            setRelays(userRelays);
            return;
          }
        }
      } catch (e) {
        console.error('NIP-65の取得失敗:', e);
      }

      if (isMounted) {
        console.log('NIP-65未設定または失敗のためデフォルトリレーを使用');
        setRelays(DEFAULT_RELAYS);
      }
    };

    fetchUserRelays();

    return () => {
      isMounted = false;
    };
  }, [pubkey]);

  // 2. pubkey に基づいてフォローリストを取得 (Kind 3)
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

  // 3. タイムラインの取得とリアルタイム購読
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setPosts([]);

    const now = Math.floor(Date.now() / 1000);
    let filter: any = {};

    if (mode === 'PHANTOM') {
      filter = {
        kinds: [1],
        limit: 50,
      };
      if (follows.length > 0) {
        filter.authors = follows;
      }
    } else {
      const ONE_YEAR = 365 * 24 * 60 * 60;
      const SIX_HOURS = 6 * 60 * 60;
      const oneYearAgoNow = now - ONE_YEAR;

      filter = {
        kinds: [1],
        since: oneYearAgoNow - SIX_HOURS,
        until: oneYearAgoNow,
        limit: 200,
      };
      if (follows.length > 0) {
        filter.authors = follows;
      }
    }

    const fetchPosts = async () => {
      try {
        const fetchedEvents = (await pool.querySync(relays, filter)) as NostrEvent[];
        if (isMounted) {
          const sorted = fetchedEvents.sort((a, b) => b.created_at - a.created_at);
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

  // 4. PHANTOMモードでのフェードアウトタイマー処理
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

  return { posts, loading, relays };
}