import { useState } from 'react';
import { pool, DEFAULT_RELAYS } from '../lib/nostr';

interface PostFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostForm({ isOpen, onClose }: PostFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !window.nostr) return;

    setIsSubmitting(true);
    try {
      const template = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: content,
      };
      const signedEvent = await window.nostr.signEvent(template);
      await pool.publish(DEFAULT_RELAYS, signedEvent);
      setContent('');
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今なにしてる？"
            className="w-full h-32 bg-slate-800 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex justify-end gap-2 mt-3">
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
            >
              {isSubmitting ? '送信中...' : '投稿する 🤘'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
