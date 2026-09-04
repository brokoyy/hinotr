import React, { useState, useRef, useEffect } from 'react';
import { pool, DEFAULT_RELAYS } from '../lib/nostr';
import { EmojiPicker } from './EmojiPicker';

interface PostFormProps {
  isOpen: boolean;
  onClose: () => void;
  pubkey?: string | null; // ユーザーごとの絵文字履歴を分けるために受け取れるようにする（任意）
}

export function PostForm({ isOpen, onClose, pubkey }: PostFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // モーダルが開いたときに状態を初期化するなどが必要ならここで行う
  useEffect(() => {
    if (!isOpen) {
      setShowEmojiPicker(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 絵文字選択時の処理（カーソル位置への挿入）
  const handleSelectEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + emoji + content.substring(end);

    setContent(newContent);

    // カーソル位置を絵文字の直後に戻す
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !window.nostr) return;

    setIsSubmitting(true);
    try {
      const template = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['client', 'hinotr'], // via hinotr を付与
        ],
        content: content,
      };
      const signedEvent = await window.nostr.signEvent(template);
      await pool.publish(DEFAULT_RELAYS, signedEvent);
      setContent('');
      setShowEmojiPicker(false);
      onClose();
    } catch (error) {
      console.error('投稿失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl w-full max-w-lg shadow-2xl text-white">
        <h2 className="text-lg font-bold mb-3">投稿</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今なにしてる？"
            className="w-full h-32 bg-slate-800 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
          />

          <div className="flex items-center justify-between mt-3">
            {/* 左下：絵文字ボタン ＆ ピッカーポップアップ */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="p-2 rounded-xl text-lg hover:bg-slate-800 text-gray-300 transition"
                title="絵文字を挿入"
              >
                ☺
              </button>

              {showEmojiPicker && (
                <EmojiPicker
                  theme="dark" // PostFormは背景がスレート(ダーク風)なため固定かpropsに合わせる
                  pubkey={pubkey}
                  onSelect={handleSelectEmoji}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>

            {/* 右側：キャンセル・投稿ボタン */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
              >
                {isSubmitting ? '送信中...' : '投稿する'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
