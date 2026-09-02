import React from 'react';
import type { AppMode, Theme } from '../types/nostr';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  pubkey: string | null;
  onLogin: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  theme,
  setTheme,
  pubkey,
  onLogin,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">hinotr</h1>
      </div>

      {/* モード切り替えタブ */}
      <div className="flex items-center bg-gray-200/60 dark:bg-gray-800/60 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setMode('PHANTOM')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            mode === 'PHANTOM'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          PHANTOM
        </button>
        <button
          onClick={() => setMode('HINOTORI')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            mode === 'HINOTORI'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600 dark:text-orange-400'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          HINOTORI
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* テーマ切り替えボタン */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition"
          title="テーマ切替"
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        {/* ログイン / 設定ボタン */}
        {pubkey ? (
          <button
            onClick={onOpenSettings}
            className="p-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition"
            title="設定"
          >
            ⚙️
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