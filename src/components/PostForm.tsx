import React, { useState, useRef, useEffect } from 'react';
import { pool, DEFAULT_RELAYS } from '../lib/nostr';
import { EmojiPicker } from './EmojiPicker';
import { nip19 } from 'nostr-tools';

interface PostFormProps {
  isOpen: boolean;
  onClose: () => void;
  pubkey?: string | null;
}

interface MentionUser {
  pubkey: string;
  npub: string;
  name: string;
  picture?: string;
}

export function PostForm({ isOpen, onClose, pubkey }: PostFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // メンション補完用の一覧・状態
  const [follows, setFollows] = useState<MentionUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // モーダルが開いたときの初期化とフォローリスト（名前解決用）の取得
  useEffect(() => {
    if (!isOpen) {
      setShowEmojiPicker(false);
      setMentionQuery(null);
      return;
    }

    let isMounted = true;
    if (!pubkey) return;

    // フォローリスト（Kind 3）を取得し、それぞれのプロフィール（Kind 0）を軽く引く
    const fetchFollowsAndProfiles = async () => {
      try {
        const targetRelays = Array.from(new Set([...DEFAULT_RELAYS, 'wss://purplepag.es']));
        const events = await pool.querySync(targetRelays, {
          kinds: [3],
          authors: [pubkey],
          limit: 1,
        } as any);

        if (!isMounted || events.length === 0) return;

        const followPubkeys = events[0].tags
          .filter((t) => t[0] === 'p')
          .map((t) => t[1]);

        if (followPubkeys.length === 0) return;

        // プロフィール（Kind 0）を一括取得（最大50件程度に絞るか、または取得できる範囲で）
        const profileEvents = await pool.querySync(DEFAULT_RELAYS, {
          kinds: [0],
          authors: followPubkeys.slice(0, 50),
        } as any);

        const userMap = new Map<string, MentionUser>();
        
        // まずnpubベースで初期データを入れておく
        followPubkeys.forEach((pk) => {
          try {
            const np = nip19.npubEncode(pk);
            userMap.set(pk, { pubkey: pk, npub: np, name: np.slice(0, 10) + '...' });
          } catch (e) {}
        });

        // Kind 0のメタデータで上書き
        profileEvents.forEach((ev) => {
          try {
            const meta = JSON.parse(ev.content);
            const np = nip19.npubEncode(ev.pubkey);
            userMap.set(ev.pubkey, {
              pubkey: ev.pubkey,
              npub: np,
              name: meta.display_name || meta.name || np.slice(0, 10) + '...',
              picture: meta.picture,
            });
          } catch (e) {}
        });

        if (isMounted) {
          setFollows(Array.from(userMap.values()));
        }
      } catch (e) {
        console.error('メンション用フォロー情報の取得失敗:', e);
      }
    };

    fetchFollowsAndProfiles();
    return () => {
      isMounted = false;
    };
  }, [isOpen, pubkey]);

  // 入力値変更時の監視（@メンションの検知）
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setContent(val);

    // カーソル位置より前にあるテキストから最後の "@" を探す
    const textBeforeCursor = val.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // "@" の直前の文字がスペースや改行、あるいは文頭であるかチェック（メールアドレス等の誤爆を防ぐ）
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (/\s/.test(charBeforeAt)) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        // スペースや改行が入っていたらメンションモード終了
        if (!/\s/.test(query)) {
          setMentionQuery(query);
          setMentionStartIndex(lastAtIndex);
          setSelectedIndex(0);
          return;
        }
      }
    }

    setMentionQuery(null);
    setMentionStartIndex(-1);
  };

  // メンション候補の絞り込み
  const filteredFollows = mentionQuery !== null
    ? follows.filter((user) => 
        user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        user.npub.toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 5) // 最大5件表示
    : [];

  // メンション候補の選択確定
  const selectMention = (user: MentionUser) => {
    if (mentionStartIndex === -1) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    // @ から現在のカーソル位置までの文字列を置き換える
    const before = content.slice(0, mentionStartIndex);
    const after = content.slice(cursorPosition);
    
    // NIP-27 形式（nostr:npub...）または名前表記にする
    // ここではわかりやすく `@表示名` (内部でnpubに置換される形) にします
    const mentionText = `@${user.name} `;
    const newContent = before + mentionText + after;

    setContent(newContent);
    setMentionQuery(null);
    setMentionStartIndex(-1);

    // カーソルを挿入したテキストの末尾に移動
    const newCursorPos = mentionStartIndex + mentionText.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // キーボード操作（上下矢印で候補選択、Enterで決定）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredFollows.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredFollows.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredFollows.length) % filteredFollows.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(filteredFollows[selectedIndex]);
      } else if (e.key === 'Escape') {
        setMentionQuery(null);
      }
    }
  };

  // 絵文字選択時の処理
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
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // 投稿送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !window.nostr) return;

    setIsSubmitting(true);
    try {
      // 本文中の "@表示名" から紐づくpubkeyを探し、NIP-27 / pタグを自動構築する高度な処理も可能ですが、
      // まずはタグ（pタグ）やcontentの紐付けを行います。
      const tags: string[][] = [
        ['client', 'hinotr'],
      ];

      // 本文に含まれるユーザーを検知してpタグを追加する簡易処理
      follows.forEach((user) => {
        if (content.includes(`@${user.name}`)) {
          tags.push(['p', user.pubkey]);
        }
      });

      const template = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: tags,
        content: content,
      };

      const signedEvent = await window.nostr.signEvent(template);
      await pool.publish(DEFAULT_RELAYS, signedEvent);
      setContent('');
      setShowEmojiPicker(false);
      setMentionQuery(null);
      onClose();
    } catch (error) {
      console.error('投稿失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl w-full max-w-lg shadow-2xl text-white relative">
        <h2 className="text-lg font-bold mb-3">投稿</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="今なにしてる？ (@でメンション)"
              className="w-full h-32 bg-slate-800 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
            />

            {/* メンション候補のオートコンプリートポップアップ */}
            {mentionQuery !== null && filteredFollows.length > 0 && (
              <div className="absolute left-0 bottom-full mb-2 w-full bg-slate-800 border border-white/15 rounded-xl shadow-xl overflow-hidden z-20">
                <div className="p-1 text-xs text-gray-400 border-b border-white/10 px-3">
                  メンバーを選択 (@{mentionQuery})
                </div>
                {filteredFollows.map((user, idx) => (
                  <div
                    key={user.pubkey}
                    onClick={() => selectMention(user)}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition ${
                      idx === selectedIndex ? 'bg-blue-600/40 text-white' : 'hover:bg-slate-700 text-gray-200'
                    }`}
                  >
                    {user.picture ? (
                      <img src={user.picture} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">?</div>
                    )}
                    <div className="truncate text-xs">
                      <span className="font-bold">{user.name}</span>
                      <span className="text-gray-400 ml-2 text-[10px]">{user.npub}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  theme="dark"
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
