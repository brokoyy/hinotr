import { useState, useEffect, useRef } from 'react';
import type { AppMode, Theme } from './types/nostr';
import { loginWithNip07 } from './lib/nostr';
import { useNostrTimeline } from './hooks/useNostrTimeline';
import { useNostrNotifications } from './hooks/useNostrNotifications';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { PostForm } from './components/PostForm';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsModal } from './components/NotificationsModal';

const STORAGE_KEY_PUBKEY = 'hinotr_pubkey';
const STORAGE_KEY_THEME = 'hinotr_theme';
const STORAGE_KEY_LAST_READ = 'hinotr_last_read_time';

export default function App() {
  const [mode, setMode] = useState<AppMode>('PHANTOM');
  
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch (e) {}
    return 'light';
  });

  const [pubkey, setPubkey] = useState<string | null>(null);
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // 実際のスクロール位置（ピクセル）を管理
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 最後に通知を確認したタイムスタンプの管理
  const [lastReadTime, setLastReadTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LAST_READ);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY_PUBKEY);
    if (savedKey) {
      setPubkey(savedKey);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {}
  }, [theme]);

  const { posts, pendingPosts, loadNewPosts, relays, userProfile } = useNostrTimeline(pubkey, mode);
  const { notifications, loading: notificationsLoading } = useNostrNotifications(pubkey);

  const hasUnread = notifications.length > 0 && notifications[0].created_at > lastReadTime;

  // スクロール位置（px）を取得
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  };

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
    if (notifications.length > 0) {
      const latestTime = notifications[0].created_at;
      setLastReadTime(latestTime);
      try {
        localStorage.setItem(STORAGE_KEY_LAST_READ, String(latestTime));
      } catch {}
    }
  };

  const handleLogin = async () => {
    const key = await loginWithNip07();
    if (key) {
      localStorage.setItem(STORAGE_KEY_PUBKEY, key);
      setPubkey(key);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY_PUBKEY);
    setPubkey(null);
  };

  // ブログの記事通りのグラデーション遷移を実装
  // 上部（scrollTop = 0付近）は白または黒から始まり、下にスクロールするにつれてカラー（青/オレンジ）がダイナミックに濃く広がる
  const getDynamicBackground = () => {
    // スクロール量（最大1000pxでグラデーションが深く沈み込むように調整）
    const offset = Math.min(scrollTop, 1000);

    if (mode === 'PHANTOM') {
      if (theme === 'light') {
        // Light: 上部はクリアな白、過去へスクロールすると爽やかなブルーが濃く染まっていく
        const blueAlpha = Math.min(0.9, 0.15 + (offset / 800) * 0.75);
        return {
          background: `linear-gradient(to bottom, #ffffff 0%, #ffffff ${Math.max(80, 250 - offset * 0.2)}px, rgba(147, 197, 253, ${blueAlpha}) 100%)`,
          color: '#0f172a',
        };
      } else {
        // Dark: 上部は完全に黒、過去へスクロールするとディープな青（blue-950/900）が濃く深くなっていく
        const darkBlueAlpha = Math.min(0.95, 0.3 + (offset / 800) * 0.65);
        return {
          background: `linear-gradient(to bottom, #000000 0%, #000000 ${Math.max(100, 300 - offset * 0.2)}px, rgba(30, 58, 138, ${darkBlueAlpha}) 100%)`,
          color: '#ffffff',
        };
      }
    } else {
      // HINOTORI モード
      if (theme === 'light') {
        // Light: 上部は白、過去へスクロールすると温かみのあるオレンジが濃く染まっていく
        const orangeAlpha = Math.min(0.9, 0.15 + (offset / 800) * 0.75);
        return {
          background: `linear-gradient(to bottom, #ffffff 0%, #ffffff ${Math.max(80, 250 - offset * 0.2)}px, rgba(253, 186, 116, ${orangeAlpha}) 100%)`,
          color: '#0f172a',
        };
      } else {
        // Dark: 上部は黒、過去へスクロールすると重厚なオレンジ（赤褐色・オレンジ-950系）が濃く深くなっていく
        const darkOrangeAlpha = Math.min(0.95, 0.3 + (offset / 800) * 0.65);
        return {
          background: `linear-gradient(to bottom, #000000 0%, #000000 ${Math.max(100, 300 - offset * 0.2)}px, rgba(124, 45, 18, ${darkOrangeAlpha}) 100%)`,
          color: '#ffffff',
        };
      }
    }
  };

  const currentStyle = getDynamicBackground();

  return (
    <div 
      className="min-h-screen transition-colors duration-100"
      style={{ background: currentStyle.background, color: currentStyle.color }}
    >
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="max-w-xl mx-auto h-screen border-x border-white/10 flex flex-col relative overflow-y-auto overflow-x-hidden"
      >
        <Header
          mode={mode}
          setMode={setMode}
          theme={theme}
          setTheme={setTheme}
          pubkey={pubkey}
          userProfile={userProfile}
          onLogin={handleLogin}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenNotifications={handleOpenNotifications}
          hasUnread={hasUnread}
        />

        <main className="flex-1 flex flex-col min-h-0">
          {!pubkey && (
            <div className="p-12 text-center text-sm opacity-80 flex flex-col items-center gap-4">
              <p>NIP-07 拡張機能でログインするとタイムラインが表示されます。</p>
            </div>
          )}

          {pubkey && posts.length === 0 && (
            <div className="p-8 text-center text-xs opacity-60">
              タイムラインを読み込み中...
            </div>
          )}

          {pubkey && posts.length > 0 && (
            <Timeline 
              posts={posts} 
              pendingPosts={pendingPosts} 
              onLoadNew={loadNewPosts} 
              mode={mode} 
            />
          )}
        </main>

        {/* 投稿ボタン：羽ペンアイコン */}
        {mode === 'PHANTOM' && pubkey && (
          <button
            onClick={() => setIsPostFormOpen(true)}
            className="fixed bottom-6 right-6 lg:left-[calc(50%+30rem)] lg:bottom-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-105 z-40"
            title="投稿する"
          >
            <svg className="w-7 h-7 fill-current" viewBox="0 0 512 512">
              <path d="M447.1 64.9c-29.2-29.2-76.6-29.2-105.8 0L77.7 328.5c-7.5 7.5-12.8 16.8-15.1 27L41.3 454.4c-3.1 13.7 9 25.8 22.7 22.7l98.9-21.3c10.2-2.2 19.5-7.6 27-15.1L447.2 170.7c29.2-29.2 29.2-76.6 0-105.8zM147.2 419.2l-58.4 12.6 12.6-58.4L278 194.2l45.8 45.8-176.6 179.2zM336.5 208.5l-45.8-45.8 43.1-43.1c14.6-14.6 38.3-14.6 52.9 0l31.5 31.5c14.6 14.6 14.6 38.3 0 52.9l-81.7 44.5z" />
              <path fill="#2563EB" d="M192.2 301.2l128-128c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0l-128 128c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0z" />
            </svg>
          </button>
        )}

        <PostForm
          isOpen={isPostFormOpen}
          onClose={() => setIsPostFormOpen(false)}
          pubkey={pubkey} 
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onLogout={handleLogout}
          relays={relays}
          theme={theme}
          setTheme={setTheme}
        />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          theme={theme}
          notifications={notifications}
          loading={notificationsLoading}
        />
      </div>
    </div>
  );
}
