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

  // アイコンと数字（カウント）をシンプルに表示する
  const getNotificationBadge = (kind: number, count?: number) => {
    const cnt = count || 1;
    switch (kind) {
      case 1:
        return { icon: '💬', label: `リプライ ${cnt}`, color: 'text-blue-500 bg-blue-500/10' };
      case 6:
        return { icon: '🔁', label: `${cnt}`, color: 'text-green-500 bg-green-500/10' };
      case 7:
        return { icon: '♡', label: `${cnt}`, color: 'text-pink-500 bg-pink-500/10' };
      default:
        return { icon: '✨', label: `${cnt}`, color: 'text-orange-500 bg-orange-500/10' };
    }
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
            const badge = getNotificationBadge(item.kind, item.count);
            const profile = item.userProfile;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                  isDark
                    ? 'bg-gray-700/40 border-gray-700 hover:bg-gray-700/70'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100/80'
                }`}
              >
                {/* ヘッダー情報（バッジ ＆ 送信者アイコン・名前） */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${badge.color}`}>
                    <span className="text-sm">{badge.icon}</span>
                    <span className="font-mono">{badge.label}</span>
                  </span>

                  {/* 送信者アイコン ＆ 名前 */}
                  <div className="flex items-center gap-1.5">
                    {profile?.picture ? (
                      <img
                        src={profile.picture}
                        alt="Avatar"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-400 animate-pulse" />
                    )}
                    <span className="font-medium opacity-90 truncate max-w-[120px]">
                      {profile?.display_name || profile?.name || formatPubkey(item.pubkey)}
                    </span>
                    {item.count && item.count > 1 && (
                      <span className="text-[10px] opacity-60 font-mono">他</span>
                    )}
                  </div>
                </div>

                {/* リプライの場合のみテキスト表示 */}
                {item.kind === 1 && item.content && (
                  <p className="text-sm whitespace-pre-wrap break-words opacity-90 font-medium">
                    {item.content}
                  </p>
                )}

                {/* 対象となった元の自分の投稿（引用風カード） */}
                {item.targetEvent && (
                  <div
                    className={`mt-1 p-2.5 rounded-lg border text-xs space-y-1 ${
                      isDark
                        ? 'bg-black/30 border-white/10 text-gray-300'
                        : 'bg-white border-gray-200 text-gray-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between opacity-50 text-[10px] font-mono">
                      <span>対象の投稿</span>
                      <span>{formatPubkey(item.targetEvent.pubkey)}</span>
                    </div>
                    <p className="line-clamp-2 opacity-90">
                      {item.targetEvent.content}
                    </p>
                  </div>
                )}

                <div className="text-[10px] opacity-40 text-right pt-1 font-mono">
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
