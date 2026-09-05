import React, { useState, useEffect, useRef } from 'react';
import type { Theme } from '../types/nostr';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  theme: Theme;
  pubkey?: string | null;
}

interface Category {
  name: string;
  icon: string;
  emojis?: string[];
  isFrequent?: boolean;
}

// 豊富な絵文字データを綺麗に整理したカテゴリ一覧
const EMOJI_CATEGORIES: Category[] = [
  {
    name: 'よく使う',
    icon: '🕒',
    isFrequent: true,
  },
  {
    name: '顔・感情',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', 
      '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', 
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', 
      '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', 
      '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '🥱', '🤤', '😪', '😳', '🥺', 
      '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', 
      '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', 
      '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'
    ],
  },
  {
    name: '人物・身体',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', 
      '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', 
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', 
      '👀', '👁️', '👅', '👄', '💋', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '👨‍🦱', 
      '👩‍🦰', '👨‍🦰', '👱‍♀️', '👱‍♂️', '👩‍🦳', '👨‍🦳', '👩‍🦲', '👨‍🦲', '🧔', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳‍♂️', '🧕', 
      '👮‍♀️', '👮‍♂️', '👷‍♀️', '👷‍♂️', '💂‍♀️', '💂‍♂️', '🕵️‍♀️', '🕵️‍♂️', '👩‍⚕️', '👨‍⚕️', '👩‍🌾', '👨‍🌾', '👩‍🍳', '👨‍🍳', '👩‍🎓', '👨‍🎓', 
      '👩‍🎤', '👨‍🎤', '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭', '👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼', '👩‍🔧', '👨‍🔧', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨', 
      '👩‍🚒', '👨‍🚒', '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '👰‍♀️', '👰‍♂️', '🤵‍♀️', '🤵‍♂️', '👸', '🤴', '🥷', '🦸‍♀️'
    ],
  },
  {
    name: '動物・自然',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', 
      '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', 
      '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', 
      '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', 
      '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', 
      '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', 
      '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁'
    ],
  },
  {
    name: '食べ物・飲み物',
    icon: '🍎',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', 
      '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', 
      '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🍳', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', 
      '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', 
      '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', 
      '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🍯', '🥛', 
      '🍼', '🫖', '🍵', '☕', '🧃', '🧉', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🧊'
    ],
  },
  {
    name: 'アクティビティ',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', 
      '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', 
      '🎿', '⛷️', '🏂', '🤾‍♀️', '🤾‍♂️', '🏋️‍♀️', '🏋️‍♂️', '🤼‍♀️', '🤼‍♂️', '🤸‍♀️', '🤸‍♂️', '⛹️‍♀️', '⛹️‍♂️', '🤺', '🏌️‍♀️', 
      '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘‍♂️', '🏄‍♀️', '🏄‍♂️', '🏊‍♀️', '🏊‍♂️', '🤽‍♀️', '🤽‍♂️', '🚣‍♀️', '🚣‍♂️', '🧗‍♀️', '🧗‍♂️', '🚴‍♀️', '🚴‍♂️', 
      '🚵‍♀️', '🚵‍♂️', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻'
    ],
  },
  {
    name: '旅行・乗り物',
    icon: '🚗',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', 
      '🛺', '🚲', '🛴', '🦽', '🦼', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚝', 
      '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', 
      '🚁', '🛶', '⛵', '🚤', '🛥️', '🚢', '🛟', '⚓', '🪝', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺️', '🗿', 
      '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻'
    ],
  },
  {
    name: 'オブジェクト・記号',
    icon: '💡',
    emojis: [
      '💡', '🔦', '🏮', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', 
      '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', 
      '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', 
      '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🚪', '🛏️', '🛋️', '🚽', '🚿', '🛁', '🪞', '🪟', '🛍️', '🛒', 
      '🎈', '🎉', '🎊', '🎁', '🎀', '🪅', '🪩', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', 
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', 
      '💘', '💝', '💤', '💢', '💬', '💭', '💯', '🔥', '✨', '⭐', '🌟', '💫', '💥'
    ],
  }
];

const STORAGE_KEY_PREFIX = 'hinotr_frequent_emojis_';
const DEFAULT_FREQUENT: string[] = [];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, theme, pubkey }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [frequentEmojis, setFrequentEmojis] = useState<string[]>(DEFAULT_FREQUENT);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isInternalScrolling = useRef(false);

  const isDark = theme === 'dark';
  const storageKey = `${STORAGE_KEY_PREFIX}${pubkey || 'default'}`;

  // 履歴の読み込み
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
    setFrequentEmojis(DEFAULT_FREQUENT);
  }, [storageKey]);

  // 絵文字選択時
  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    setFrequentEmojis((prev) => {
      const updated = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 28);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    onClose();
  };

  // タブをクリックしたとき、該当カテゴリの場所までスムーズにスクロールする
  const handleTabClick = (idx: number) => {
    setActiveTab(idx);
    const targetEl = categoryRefs.current[idx];
    if (targetEl && scrollContainerRef.current) {
      isInternalScrolling.current = true;
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isInternalScrolling.current = false;
      }, 300);
    }
  };

  // スクロール位置に応じて自動でアクティブなタブを切り替える
  const handleScroll = () => {
    if (isInternalScrolling.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerTop = container.getBoundingClientRect().top;
    
    let currentIdx = 0;
    categoryRefs.current.forEach((el, idx) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top - containerTop <= 40) {
          currentIdx = idx;
        }
      }
    });
    setActiveTab(currentIdx);
  };

  return (
    <div
      className={`absolute bottom-12 left-0 w-80 rounded-2xl shadow-2xl border flex flex-col z-50 overflow-hidden ${
        isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      {/* カテゴリタブアイコン */}
      <div className={`flex items-center justify-around px-1 py-2 border-b ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => handleTabClick(idx)}
            title={cat.name}
            className={`p-1.5 rounded-xl text-base transition ${
              activeTab === idx
                ? (isDark ? 'bg-gray-700 text-white font-bold scale-110' : 'bg-gray-200 text-gray-900 font-bold shadow-2xs scale-110')
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* スクロール可能な全絵文字リストエリア */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="p-3 h-60 overflow-y-auto space-y-4 scroll-smooth"
      >
        {EMOJI_CATEGORIES.map((cat, idx) => {
          const emojisToDisplay = cat.isFrequent ? frequentEmojis : (cat.emojis || []);

          return (
            <div
              key={cat.name}
              ref={(el) => { categoryRefs.current[idx] = el; }}
            >
              <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 px-1">
                {cat.name}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {emojisToDisplay.map((emoji, eIdx) => (
                  <button
                    key={eIdx}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className={`h-8 w-8 flex items-center justify-center text-lg rounded-lg transition ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
