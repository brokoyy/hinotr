import React from 'react';
import type { Theme } from '../types/nostr';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  relays: string[];
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  relays,
  theme,
  setTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl text-gray-900 dark:text-gray-100 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 className="text-xl font-bold">⚙️ 設定</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            ✕
          </button>
        </div>

        {/* ★ テーマ切り替えセクションを追加 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">テーマ設定</h3>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold flex items-center justify-between transition"
          >
            <span>表示モード</span>
            <span>{theme === 'light' ? '☀️ ライトモード (Light)' : '🌙 ダークモード (Dark)'}</span>
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">接続中リレー</h3>
          <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-xl space-y-2">
            {relays.map((relay) => (
              <div key={relay} className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                • {relay}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full py-2 bg-red-500/10 text-red-600 border border-red-200 dark:border-red-800/40 rounded-xl font-medium hover:bg-red-500 hover:text-white transition"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
};
