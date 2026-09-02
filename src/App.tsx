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

  // 画面ロード時に localStorage から pubkey を復元
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY_PUBKEY);
    if (savedKey) {
      console.log('保存された pubkey を復元しました:', savedKey);
      setPubkey(savedKey);
    }
  }, []);

  // NIP-65 対応の動的リレーリストも受け取る
  const { posts, loading, relays } = useNostrTimeline(pubkey, mode);

  // ログイン処理
  const handleLogin = async () => {
    const key = await loginWithNip07();
    if (key) {
      localStorage.setItem(STORAGE_KEY_PUBKEY, key);
      setPubkey(key);
    }
  };

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY_PUBKEY);
    setPubkey(null);
  };

  const themeClasses = {
    PHANTOM: {
      light: 'bg-gradient-to-b from-white to-slate-900 text-slate-900',
      dark: 'bg-gradient-to-b from-black to-slate-950 text-white',
    },
    HINOTORI: {
      light: 'bg-gradient-to-b from-white to-orange-600 text-slate-900',
      dark: 'bg-gradient-to-b from-black to-orange-950 text-white',
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
          onLogin={handleLogin}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="flex-1">
          {loading && (
            <div className="p-8 text-center text-xs opacity-60">
              タイムラインを読み込み中...
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="p-8 text-center text-xs opacity-60">
              {pubkey
                ? '表示できる投稿がありません。'
                : 'NIP-07でログインするとフォロー中のタイムラインが表示されます。'}
            </div>
          )}

          {posts.map((post) => (
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

        {/* 設定モーダル（接続中リレーの確認＆ログアウト） */}
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