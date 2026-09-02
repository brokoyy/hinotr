import React from 'react';
import type { AppMode, Theme } from '../types/nostr';
import type { UserProfile } from '../hooks/useNostrTimeline';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  pubkey: string | null;
  userProfile?: UserProfile | null;
  onLogin: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  theme,
  setTheme,
  pubkey,
  userProfile,
  onLogin,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-black/40 border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-white">hinotr</h1>
      </div>

      {/* モード切り替えタブ */}
      <div className="flex items-center bg-black/30 p-1 rounded-xl text-xs font-semibold border border-white/10">
        <button
          onClick={() => setMode('PHANTOM')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            mode === 'PHANTOM'
              ? 'bg-white/20 text-blue-400 font-bold'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          PHANTOM
        </button>
        <button
          onClick={() => setMode('HINOTORI')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            mode === 'HINOTORI'
              ? 'bg-white/20 text-orange-400 font-bold'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          HINOTORI
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* テーマ切替 */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 text-xs bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/10"
          title="テーマ切替"
        >
          {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
        </button>

        {/* ログインアイコン ＆ 設定 */}
        {pubkey ? (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 p-1 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/10"
            title="設定"
          >
            {userProfile?.picture ? (
              <img
                src={userProfile.picture}
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <span className="px-1.5">⚙️</span>
            )}
          </button>
        ) : (
          <button
            onClick={onLogin}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition"
          >
            ログイン
          </button>
        )}
      </div>
    </header>
  );
};