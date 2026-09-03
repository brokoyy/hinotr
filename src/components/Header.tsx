import React from 'react';
import { nip19 } from 'nostr-tools';
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
  onOpenNotifications?: () => void; // ★ 追加: 通知モーダルを開くコールバック（任意）
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  theme,
  pubkey,
  userProfile,
  onLogin,
  onOpenSettings,
  onOpenNotifications,
}) => {
  const isDark = theme === 'dark';

  const formatNpub = (hexKey: string) => {
    try {
      const npub = nip19.npubEncode(hexKey);
      return `@${npub.slice(0, 12)}...${npub.slice(-8)}`;
    } catch (e) {
      return `@${hexKey.slice(0, 8)}...${hexKey.slice(-8)}`;
    }
  };

  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur-md transition-colors duration-300 border-b px-4 py-3 flex items-center justify-between ${
        isDark
          ? 'bg-black/40 border-white/10 text-white'
          : 'bg-white/80 border-gray-200 text-gray-900 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">hinotr</h1>
      </div>

      {/* モード切り替えタブ */}
      <div
        className={`flex items-center p-1 rounded-xl text-xs font-semibold border ${
          isDark
            ? 'bg-black/30 border-white/10'
            : 'bg-gray-100 border-gray-200'
        }`}
      >
        <button
          onClick={() => setMode('PHANTOM')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            mode === 'PHANTOM'
              ? isDark
                ? 'bg-white/20 text-blue-400 font-bold'
                : 'bg-white text-blue-600 shadow-sm font-bold'
              : isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          PHANTOM
        </button>
        <button
          onClick={() => setMode('HINOTORI')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            mode === 'HINOTORI'
              ? isDark
                ? 'bg-white/20 text-orange-400 font-bold'
                : 'bg-white text-orange-600 shadow-sm font-bold'
              : isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          HINOTORI
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* ★ 元のLight/Darkボタンの位置に配置した通知ボタン */}
        <button
          onClick={onOpenNotifications}
          className={`p-2 text-sm rounded-xl transition border relative ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
          }`}
          title="通知"
        >
          🔥
          {/* 未読がある場合に光らせるバッジのサンプル（必要に応じて条件分岐できます） */}
          {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /> */}
        </button>

        {/* ログインアイコン ＆ 設定 */}
        {pubkey ? (
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition border ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 border-white/10'
                : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
            }`}
            title="設定"
          >
            {userProfile?.picture ? (
              <img
                src={userProfile.picture}
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
            )}
            <span className="text-xs font-mono opacity-80 hidden sm:inline">
              {formatNpub(pubkey)}
            </span>
          </button>
        ) : (
          <button
            onClick={onLogin}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition"
          >
            NIP-07でログイン
          </button>
        )}
      </div>
    </header>
  );
};
