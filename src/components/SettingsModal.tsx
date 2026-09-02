import React, { useState } from 'react';
import { getStoredRelays, saveStoredRelays, DEFAULT_RELAYS } from '../lib/nostr';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onLogout }) => {
  const [relays, setRelays] = useState<string[]>(getStoredRelays());
  const [newRelay, setNewRelay] = useState('');

  if (!isOpen) return null;

  const handleAddRelay = () => {
    let url = newRelay.trim();
    if (!url) return;
    if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
      url = 'wss://' + url;
    }
    if (!relays.includes(url)) {
      setRelays([...relays, url]);
      setNewRelay('');
    }
  };

  const handleRemoveRelay = (url: string) => {
    setRelays(relays.filter((r) => r !== url));
  };

  const handleResetDefault = () => {
    setRelays(DEFAULT_RELAYS);
  };

  const handleSave = () => {
    saveStoredRelays(relays);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl text-gray-900 dark:text-gray-100 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">⚙️ 設定</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            ✕
          </button>
        </div>

        {/* リレー編集エリア */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">接続中リレーの編集</h3>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="wss://relay.example.com"
              value={newRelay}
              onChange={(e) => setNewRelay(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-xl text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none"
            />
            <button
              onClick={handleAddRelay}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition"
            >
              追加
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {relays.map((relay) => (
              <div
                key={relay}
                className="flex justify-between items-center bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-lg text-xs font-mono"
              >
                <span className="truncate mr-2">{relay}</span>
                <button
                  onClick={() => handleRemoveRelay(relay)}
                  className="text-red-500 hover:text-red-700 font-bold px-1"
                >
                  削除
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleResetDefault}
            className="text-xs text-blue-500 underline hover:text-blue-600"
          >
            デフォルトのリレー設定に戻す
          </button>
        </div>

        {/* 保存ボタン */}
        <div>
          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            保存してタイムラインに反映
          </button>
        </div>

        {/* ログアウトボタン */}
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