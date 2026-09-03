import React from 'react';
import type { Theme } from '../types/nostr';
import type { NotificationItem } from '../hooks/useNostrNotifications';
import { nip19 } from 'nostr-tools';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  notifications: NotificationItem[];
  loading: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  theme,
  notifications,
  loading,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const formatPubkey = (hex: string) => {
    try {
      const npub = nip19.npubEncode(hex);
      return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
    } catch {
      return `${hex.slice(0, 6)}...`;
    }
  };

  const getNotificationBadge = (kind: number) => {
    switch (kind) {
      case 1:
        return { icon: '💬', label: 'リプライ / メンション', color: 'text-blue-500 bg-blue-500/10' };
      case 6:
        return { icon: '🔄', label: 'リポスト', color: 'text-green-500 bg-green-500/10' };
      case 7:
        return { icon: '❤️', label: 'リアクション', color: 'text-pink-500 bg-pink-500/10' };
      default:
        return { icon: '✨', label: `Kind ${kind}`, color: 'text-orange-500 bg-orange-500/10' };
    }
  };

  // リポストのJSONから元のコンテンツを安全に抽出するヘルパー
  const parseNotificationContent = (item: NotificationItem) => {
    if (item.kind === 6) {
      try {
        const parsed = JSON.parse(item.content);
        if (parsed && typeof parsed.content === 'string') {
          return {
            type: 'repost',
            text: parsed.content,
            note: 'あなたの投稿をリポストしました',
          };
        }
      } catch {
        // パースに失敗した場合はそのまま表示
      }
    }
    return {
      type: 'normal',
      text: item.content,
      note: null,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 max-h-[80vh] flex flex-col ${
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

        {/* 通知一覧エリア */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {loading && notifications.length === 0 && (
            <div className="py-8 text-center text-xs opacity-60">
              通知を読み込み中...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div
              className={`p-6 rounded-xl border text-center text-xs opacity-70 ${
                isDark
                  ? 'bg-gray-700/30 border-gray-700 text-gray-300'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              まだ通知はありません。
            </div>
          )}

          {notifications.map((item) => {
            const badge = getNotificationBadge(item.kind);
            const parsed = parseNotificationContent(item);

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition ${
                  isDark
                    ? 'bg-gray-700/40 border-gray-700 hover:bg-gray-700/70'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${badge.color}`}>
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </span>
                  <span className="opacity-50 font-mono text-[10px]">
                    {formatPubkey(item.pubkey)}
                  </span>
                </div>

                {/* リポストの場合は補足を表示 */}
                {parsed.note && (
                  <div className="text-[11px] opacity-60 mb-1 font-medium">
                    {parsed.note}
                  </div>
                )}

                <p className="text-sm whitespace-pre-wrap break-words opacity-90 line-clamp-3">
                  {parsed.text || (item.kind === 7 ? 'リアクションしました' : '(コンテンツなし)')}
                </p>

                <div className="text-[10px] opacity-40 text-right mt-2 font-mono">
                  {new Date(item.created_at * 1000).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-end">
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
