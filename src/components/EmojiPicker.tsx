import React, { useState, useEffect } from 'react';
import type { Theme } from '../types/nostr';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  theme: Theme;
  pubkey?: string | null; // ユーザーごとに履歴を分けるためのpubkey（任意）
}

const EMOJI_CATEGORIES = [
  {
    name: 'よく使う',
    icon: '🕒',
    isFrequent: true,
  },
  {
    name: '顔・感情',
    icon: '😀',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  },
  {
    name: '動物・自然',
    icon: '🐶',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆'],
  },
  {
    name: '食べ物',
    icon: '🍎',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🍳', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕'],
  },
  {
    name: 'アクティビティ',
    icon: '⚽',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🤼‍♀️', '🤸‍♀️', '⛹️‍♀️', '🤺', '🤾‍♀️', '🏌️‍♀️'],
  },
  {
    name: '乗り物',
    icon: '🚗',
    emojis: ['🚗', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉'],
  },
  {
    name: 'シンボル・その他',
    icon: '💡',
    emojis: ['💡', '🔦', '🏮', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🚪', '🛏️', '🛋️', '🚽', '🚿', '🛁', '🪞', '🪟'],
  }
];

const STORAGE_KEY_PREFIX = 'hinotr_frequent_emojis_';
const DEFAULT_FREQUENT = ['😆', '👏', '👍', '👀', '😀', '✨', '😍', '😘', '☀️', '😂', '😜', '🎂', '🤣', '😅', '🤯', '🎉', '🅱️', '💡', '👑', '🫣', '✊', '👻', '😇', '💪', '🙌', '😌', '😭'];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, theme, pubkey }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [frequentEmojis, setFrequentEmojis] = useState<string[]>(DEFAULT_FREQUENT);
  const isDark = theme === 'dark';

  const storageKey = `${STORAGE_KEY_PREFIX}${pubkey || 'default'}`;

  // マウント時にローカルストレージからよく使う絵文字の履歴を読み込む
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFrequentEmojis(parsed);
          return;
        }
      }
    } catch {}
    // 保存データがない場合はデフォルトセット
    setFrequentEmojis(DEFAULT_FREQUENT);
  }, [storageKey]);

  // 絵文字が選ばれたときの処理（使用回数をカウント・並び替えして保存）
  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);

    setFrequentEmojis((prev) => {
      // 既存リストから除外して先頭に追加、最大28個（4行分）まで保持
      const updated = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 28);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    onClose();
  };

  const currentCategory = EMOJI_CATEGORIES[activeTab];
  const displayEmojis = currentCategory.isFrequent ? frequentEmojis : (currentCategory.emojis || []);

  return (
    <div
      className={`absolute bottom-12 left-0 w-80 rounded-2xl shadow-2xl border flex flex-col z-50 overflow-hidden ${
        isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      {/* カテゴリタブアイコン */}
      <div className={`flex items-center justify-around px-2 py-2 border-b ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            onClick={() => setActiveTab(idx)}
            title={cat.name}
            className={`p-2 rounded-xl text-lg transition ${
              activeTab === idx
                ? (isDark ? 'bg-gray-700 text-white font-bold' : 'bg-gray-200 text-gray-900 font-bold shadow-2xs')
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* 絵文字グリッドエリア */}
      <div className="p-3 max-h-56 overflow-y-auto grid grid-cols-7 gap-1">
        {displayEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => handleEmojiClick(emoji)}
            className={`h-9 w-9 flex items-center justify-center text-xl rounded-xl transition ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
