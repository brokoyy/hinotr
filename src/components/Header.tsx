import { useState, useEffect } from 'react';
import type { AppMode, Theme } from '../types/nostr';
import { pool, DEFAULT_RELAYS } from '../lib/nostr';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  pubkey: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSettings?: () => void;
}

interface Profile {
  name?: string;
  display_name?: string;
  picture?: string;
}

export function Header({
  mode,
  setMode,
  theme,
  setTheme,
  pubkey,
  onLogin,
  onLogout,
}: HeaderProps) {
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!pubkey) {
      setMyProfile(null);
      return;
    }

    let isMounted = true;
    const fetchMyProfile = async () => {
      try {
        const event = await pool.get(DEFAULT_RELAYS, {
          kinds: [0],
          authors: [pubkey],
        });
        if (event && isMounted) {
          try {
            const data = JSON.parse(event.content);
            setMyProfile({
              name: data.name,
              display_name: data.display_name,
              picture: data.picture,
            });
          } catch {
            // JSONパースエラー時の安全対策
          }
        }
      } catch (e) {
        console.error('プロフィール取得エラー:', e);
      }
    };

    fetchMyProfile();
    return () => {
      isMounted = false;
    };
  }, [pubkey]);

  return (
    <>
      <header className="p-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-xl font-black tracking-wider">hinotr</h1>

        {/* モード切替 */}
        <div className="flex bg-black/20 p-1 rounded-full border border-white/10">
          <button
            onClick={() => setMode('PHANTOM')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
              mode === 'PHANTOM'
                ? 'bg-slate-800 text-blue-400 shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            PHANTOM
          </button>
          <button
            onClick={() => setMode('HINOTORI')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
              mode === 'HINOTORI'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            HINOTORI
          </button>
        </div>

        {/* 右側領域 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full bg-black/10 hover:bg-black/20 text-xs font-semibold"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full bg-black/10 hover:bg-black/20 text-xs transition-transform active:scale-95"
            title="設定"
          >
            ⚙️
          </button>

          {/* ログイン表示 / プロフィールバッジ */}
          {!pubkey ? (
            <button
              type="button"
              onClick={onLogin}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition-all active:scale-95"
            >
              ログイン
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-black/20 px-2.5 py-1 rounded-full border border-white/10 text-xs">
              {myProfile?.picture && (
                <img
                  src={myProfile.picture}
                  alt="avatar"
                  className="w-4 h-4 rounded-full object-cover"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className="font-semibold">
                {myProfile?.display_name || myProfile?.name || `${pubkey.slice(0, 6)}...`}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 設定モーダル */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-white">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              ⚙️ 設定
            </h2>

            {/* リレー設定表示 */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 mb-2">接続中リレー</h3>
              <ul className="bg-black/30 rounded-lg p-3 space-y-1.5 border border-white/5">
                {DEFAULT_RELAYS.map((relay, i) => (
                  <li key={i} className="text-xs text-slate-300 font-mono truncate">
                    • {relay}
                  </li>
                ))}
              </ul>
            </div>

            {/* ログイン中のアカウント操作 */}
            {pubkey ? (
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <button
                  onClick={() => {
                    onLogout();
                    setIsSettingsOpen(false);
                  }}
                  className="w-full py-2 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-all"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    onLogin();
                    setIsSettingsOpen(false);
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all"
                >
                  NIP-07 拡張機能でログイン
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}