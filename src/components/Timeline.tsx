import { useRef } from 'react';
import { PostCard } from './PostCard';
import type { AppMode, TimelinePost } from '../types/nostr';

interface TimelineProps {
  posts: TimelinePost[];
  pendingPosts: TimelinePost[];
  onLoadNew: () => void;
  mode: AppMode;
}

export function Timeline({ posts, pendingPosts, onLoadNew, mode }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop } = containerRef.current;
    if (scrollTop <= 10 && pendingPosts.length > 0) {
      onLoadNew();
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
            onClick={onLoadNew}
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
        {posts.map((post) => (
          <PostCard key={post.id} post={post} mode={mode} />
        ))}
      </div>
    </div>
  );
}
