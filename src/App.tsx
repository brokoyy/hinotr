import { useState, useEffect } from 'react';
import type { AppMode, Theme } from './types/nostr';
import { loginWithNip07 } from './lib/nostr';
import { useNostrTimeline } from './hooks/useNostrTimeline';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { PostForm } from './components/PostForm';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_KEY_PUBKEY = 'hinotr_pubkey';

export default function App() {
  const [mode, setMode] = useState<AppMode>('PHANTOM');
  const [theme, setTheme] = useState<Theme>('light');
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY_PUBKEY);
    if (savedKey) {
      setPubkey(savedKey);
    }
  }, []);

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
      light: 'bg-gradient-to-b from-white to-blue-400 text-slate-900',
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
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition"
              >
                NIP-07 でログイン
              </button>
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

        {mode === 'PHANTOM' && pubkey && (
          <button
            onClick={() => setIsPostFormOpen(true)}
            className="fixed bottom-6 right-6 lg:absolute lg:bottom-6 lg:-right-20 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-200 active:scale-95 hover:scale-105 z-40"
            title="投稿する"
          >
            🖋
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
        />
      </div>
    </div>
  );
}