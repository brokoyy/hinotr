import { useState, useEffect } from 'react';
import type { Filter } from 'nostr-tools';
import type { NostrEvent, AppMode, TimelinePost } from '../types/nostr';
import { pool, DEFAULT_RELAYS } from '../lib/nostr';

export function useNostrTimeline(pubkey: string | null, mode: AppMode) {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [follows, setFollows] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. pubkey に基づいてフォローリストを取得 (Kind 3)
  useEffect(() => {
    let isMounted = true;

    if (!pubkey) {
      setFollows([]);
      return;
    }

    const fetchFollows = async () => {
      setLoading(true);
      try {
        console.log('フォローリスト取得開始:', pubkey);

        // 拡張機能からリレー一覧を取得できる場合は追加
        let customRelays = [...DEFAULT_RELAYS];
        const nostrExt = window.nostr as any;
        if (nostrExt?.getRelays) {
          try {
            const userRelays = await nostrExt.getRelays();
            const relayUrls = Object.keys(userRelays);
            if (relayUrls.length > 0) {
              customRelays = Array.from(new Set([...customRelays, ...relayUrls]));
            }
          } catch (e) {
            console.warn('拡張機能からのリレー取得失敗:', e);
          }
        }

        const queryFilter: Filter = {
          kinds: [3],
          authors: [pubkey],
          limit: 1,
        };

        const events = await pool.querySync(customRelays, [queryFilter] as any);

        if (isMounted) {
          if (events && events.length > 0) {
            // 最新のKind 3を採用
            const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
            const followPubkeys = latestEvent.tags
              .filter((tag: string[]) => tag[0] === 'p')
              .map((tag: string[]) => tag[1]);

            console.log('フォロー数取得成功:', followPubkeys.length);
            setFollows([...followPubkeys, pubkey]);
          } else {
            console.log('フォローイベントが見つかりません。自分のみセット');
            setFollows([pubkey]);
          }
        }
      } catch (error) {
        console.error('フォローリスト取得エラー:', error);
        if (isMounted) setFollows([pubkey]);
      }
    };

    fetchFollows();

    return () => {
      isMounted = false;
    };
  }, [pubkey]);

  // 2. タイムラインの取得とリアルタイム購読
  useEffect(() => {
    let isMounted = true;

    if (pubkey && follows.length === 0) {
      return;
    }

    setLoading(true);

    const now = Math.floor(Date.now() / 1000);
    const filter: Filter = { kinds: [1] };

    if (follows.length > 0) {
      filter.authors = follows;
    } else if (pubkey) {
      filter.authors = [pubkey];
    } else {
      setPosts([]);
      setLoading(false);
      return;
    }

    if (mode === 'PHANTOM') {
      filter.since = now - 600; // 直近10分
      filter.limit = 100;
    } else {
      const ONE_YEAR = 365 * 24 * 60 * 60;
      const SIX_HOURS = 6 * 60 * 60;
      const oneYearAgoNow = now - ONE_YEAR;

      filter.since = oneYearAgoNow - SIX_HOURS;
      filter.until = oneYearAgoNow;
      filter.limit = 200;
    }

    const fetchPosts = async () => {
      try {
        console.log('投稿取得フィルター:', filter);
        const fetchedEvents = (await pool.querySync(DEFAULT_RELAYS, [filter] as any)) as NostrEvent[];
        console.log('取得された投稿数:', fetchedEvents.length);

        if (isMounted) {
          const sorted = fetchedEvents.sort((a, b) => b.created_at - a.created_at);
          setPosts(sorted);
        }
      } catch (e) {
        console.error('投稿取得エラー:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPosts();

    if (mode === 'PHANTOM') {
      const sub = pool.subscribeMany(DEFAULT_RELAYS, [filter] as any, {
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
  }, [follows, mode, pubkey]);

  // 3. 10分消去 ＆ 9分フェードアウトタイマー
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

  return { posts, loading };
}