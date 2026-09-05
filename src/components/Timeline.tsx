import { useState, useEffect, useRef } from 'react';
import { PostCard } from './PostCard';
import type { AppMode } from '../types/nostr';

interface TimelineProps {
  posts: any[];
  mode: AppMode;
}

export function Timeline({ posts: initialPosts, mode }: TimelineProps) {
  const [displayedPosts, setDisplayedPosts] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialPostsRef = useRef(initialPosts);
  useEffect(() => {
    if (initialPosts !== prevInitialPostsRef.current) {
      prevInitialPostsRef.current = initialPosts;
      if (displayedPosts.length === 0) {
        setDisplayedPosts(initialPosts);
      } else {
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
  }, [initialPosts, displayedPosts]);

  useEffect(() => {
    setDisplayedPosts(initialPosts);
  }, [initialPosts]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop } = containerRef.current;
    if (scrollTop <= 10 && pendingPosts.length > 0) {
      setDisplayedPosts((prev) => [...pendingPosts, ...prev]);
      setPendingPosts([]);
    }
  };

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

      <div>
        {displayedPosts.map((post) => (
          <PostCard key={post.id} post={post} mode={mode} />
        ))}
      </div>
    </div>
  );
}
