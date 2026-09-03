import { useState, useEffect } from 'react';
import type { AppMode, Theme } from './types/nostr';
import { loginWithNip07 } from './lib/nostr';
import { useNostrTimeline } from './hooks/useNostrTimeline';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { PostForm } from './components/PostForm';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_KEY_PUBKEY = 'hinotr_pubkey';
const STORAGE_KEY_THEME = 'hinotr_theme';

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

  const { posts, loading, relays, userProfile } = useNostrTimeline(pubkey, mode);

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

  const themeClasses = {
    PHANTOM: {
      light: 'bg-gradient-to-b from-white via-white/90 to-blue-400 text-slate-900',
      dark: 'bg-gradient-to-b from-black via-slate-950 to-blue-950 text-white',
    },
    HINOTORI: {
      light: 'bg-gradient-to-b from-white to-orange-300 text-slate-900',
      dark: 'bg-gradient-to-b from-black via-orange-950 to-orange-900 text-white',
    },
  }[mode][theme];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${themeClasses}`}>
      <div className="max-w-xl mx-auto min-h-screen border-x border-white/10 flex flex-col relative">
        <Header
          mode={mode}
          setMode={setMode}
          theme={theme}
          setTheme={setTheme}
          pubkey={pubkey}
          userProfile={userProfile}
          onLogin={handleLogin}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenNotifications={() => {
            // TODO: 通知モーダルを開く処理をここに繋げます
            alert('通知機能はまもなく実装します！');
          }}
        />

        <main className="flex-1">
          {loading && (
            <div className="p-8 text-center text-xs opacity-60">
              タイムラインを読み込み中...
            </div>
          )}

          {!loading && !pubkey && (
            <div className="p-12 text-center text-sm opacity-80 flex flex-col items-center gap-4">
              <p>NIP-07 拡張機能でログインするとタイムラインが表示されます。</p>
            </div>
          )}

          {!loading && pubkey && posts.length === 0 && (
            <div className="p-8 text-center text-xs opacity-60">
              表示できる投稿がありません。
            </div>
          )}

          {pubkey && posts.map((post) => (
            <PostCard key={post.id} post={post} mode={mode} />
          ))}
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
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onLogout={handleLogout}
          relays={relays}
          theme={theme}
          setTheme={setTheme}
        />
      </div>
    </div>
  );
}
