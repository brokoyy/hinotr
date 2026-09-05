import { useState, useEffect, useRef } from 'react';
import { PostCard } from './PostCard';
import type { AppMode } from '../types/nostr';
import type { NostrEvent } from '../types/nostr'; // ※適宜プロジェクトの型定義に合わせて調整してください

interface TimelineProps {
  posts: any[]; // useNostrTimeline から受け取る投稿配列
  mode: AppMode;
}

export function Timeline({ posts: initialPosts, mode }: TimelineProps) {
  // 画面に現在表示している投稿リスト
  const [displayedPosts, setDisplayedPosts] = useState<any[]>([]);
  // 裏で溜まっていく新着投稿リスト
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // 初回ロード時や、外部からゴッソリ投稿が更新されたとき（タブ切り替え時など）の同期
  const prevInitialPostsRef = useRef(initialPosts);
  useEffect(() => {
    if (initialPosts !== prevInitialPostsRef.current) {
      prevInitialPostsRef.current = initialPosts;
      // まだ一度も表示していないか、一番上にいる場合はそのまま反映、
      // 下を見ているときは新着に回すなどの制御も可能ですが、まずはシンプルに初期ロードを反映
      if (displayedPosts.length === 0) {
        setDisplayedPosts(initialPosts);
      } else {
        // 差分（新しく増えた分）を抽出して pending に入れる
        const existingIds = new Set(displayedPosts.map((p) => p.id));
        const newItems = initialPosts.filter((p) => !existingIds.has(p.id));
        if (newItems.length > 0) {
          setPendingPosts((prev) => {
            const currentIds = new Set(prev.map((p) => p.id));
            const trulyNew = newItems.filter((p) => !currentIds.has(p.id));
            return [...trulyNew, ...prev];
          });
        }
      }
    }
  }, [initialPosts]);

  // 初期マウント時に表示データをセット
  useEffect(() => {
    setDisplayedPosts(initialPosts);
  }, [initialPosts]);

  // スクロール位置を監視：一番上（scrollTop === 0付近）にきたらバッジの未読を自動で本体にマージする親切設計にする場合
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop } = containerRef.current;
    if (scrollTop <= 10 && pendingPosts.length > 0) {
      // 一番上まで戻ってきたら自動で新着を反映する
      setDisplayedPosts((prev) => [...pendingPosts, ...prev]);
      setPendingPosts([]);
    }
  };

  // 「新着投稿が○件あります」ボタンを押したときの処理
  const handleLoadNew = () => {
    setDisplayedPosts((prev) => [...pendingPosts, ...prev]);
    setPendingPosts([]);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div 
      ref={containerRef} 
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto relative"
    >
      {/* 新着通知バッジ（一番上に固定表示・クリックで反映） */}
      {pendingPosts.length > 0 && (
        <div className="sticky top-3 z-30 flex justify-center pointer-events-none px-4">
          <button
            onClick={handleLoadNew}
            className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <span>新着投稿が {pendingPosts.length} 件あります</span>
            <svg className="w-3.5 h-3.5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* 投稿一覧 */}
      <div>
        {displayedPosts.map((post) => (
          <PostCard key={post.id} post={post} mode={mode} />
        ))}
      </div>
    </div>
  );
}
