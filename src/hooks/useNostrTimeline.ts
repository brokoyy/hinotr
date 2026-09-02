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
        const queryFilter: Filter = {
          kinds: [3],
          authors: [pubkey],
          limit: 1,
        };
        const events = await pool.querySync(DEFAULT_RELAYS, [queryFilter] as any);

        if (isMounted) {
          if (events && events.length > 0) {
            const followPubkeys = events[0].tags
              .filter((tag: string[]) => tag[0] === 'p')
              .map((tag: string[]) => tag[1]);
            // 自分＋フォロー対象のpubkeyをセット
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
  }, [pubkey]);

  // 2. タイムラインの取得とリアルタイム購読
  useEffect(() => {
    let isMounted = true;

    // ログイン中かつフォローリスト取得前なら、取得完了まで待つ
    if (pubkey && follows.length === 0) {
      return;
    }

    setLoading(true);

    const now = Math.floor(Date.now() / 1000);
    const filter: Filter = { kinds: [1] };

    // 対象の指定（ログインしている場合はフォロー＋自分、未ログインなら自分のみ）
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
      // 10分（600秒）前以降の投稿のみを取得するよう指定
      filter.since = now - 600;
      filter.limit = 100;
    } else {
      // HINOTORI モード: 1年前の6時間分を取得
      const ONE_YEAR = 365 * 24 * 60 * 60;
      const SIX_HOURS = 6 * 60 * 60;
      const oneYearAgoNow = now - ONE_YEAR;

      filter.since = oneYearAgoNow - SIX_HOURS;
      filter.until = oneYearAgoNow;
      filter.limit = 200;
    }

    const fetchPosts = async () => {
      try {
        const fetchedEvents = (await pool.querySync(DEFAULT_RELAYS, [filter] as any)) as NostrEvent[];
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

    // PHANTOM モードの場合のみリアルタイム受信
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

  // 3. PHANTOMモードでの10分消去 ＆ 9分フェードアウトタイマー処理
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