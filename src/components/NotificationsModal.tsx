import React from 'react';
import type { Theme } from '../types/nostr';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  // TODO: 後ほど通知データのリストや読み込み中フラグをここに受け取ります
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`rounded-2xl p-6 max-w-md w-full shadow-xl space-y-6 ${
          isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
        }`}
      >
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🔥</span> 通知
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            ✕
          </button>
        </div>

        {/* 通知一覧エリア（仮表示） */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div
            className={`p-4 rounded-xl border text-center text-xs opacity-70 ${
              isDark
                ? 'bg-gray-700/30 border-gray-700 text-gray-300'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            まだ通知はありません。
            <br />
            （リレーから自分宛てのメンションやリアクションを取ってくる機能をここに繋ぎます）
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
