import React from 'react';

// Nostrのイベントから tags を受け取り、本文中の :code: を画像に置換して返すコンポーネント
interface ParsedContentProps {
  content: string;
  tags?: string[][];
  className?: string;
}

export function ParsedContent({ content, tags = [], className = '' }: ParsedContentProps) {
  // tags から ['emoji', 'ショートコード', '画像URL'] のペアを抽出してマップを作る
  const emojiMap = new Map<string, string>();
  tags.forEach((tag) => {
    if (tag[0] === 'emoji' && tag[1] && tag[2]) {
      emojiMap.set(tag[1], tag[2]);
    }
  });

  // 何もカスタム絵文字タグがなければ、そのまま文字列として扱う（必要に応じて改行などの処理を入れる）
  if (emojiMap.size === 0) {
    return <span className={className}>{content}</span>;
  }

  // :ショートコード: に一致する正規表現
  const regex = /:([a-zA-Z0-9_]+):/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0]; // 例: :kaeru:
    const code = match[1];     // 例: kaeru
    const startIndex = match.index;

    // マッチする手前の通常のテキストを追加
    if (startIndex > lastIndex) {
      parts.push(content.slice(lastIndex, startIndex));
    }

    // マッチしたコードが emojiMap に存在するか確認
    const url = emojiMap.get(code);
    if (url) {
      // カスタム絵文字の画像として描画
      parts.push(
        <img
          key={`${code}-${startIndex}`}
          src={url}
          alt={`:${code}:`}
          title={`:${code}:`}
          className="inline-block w-5 h-5 align-text-bottom object-contain mx-0.5"
          loading="lazy"
        />
      );
    } else {
      // 辞書にない場合はそのまま文字列として残す
      parts.push(fullMatch);
    }

    lastIndex = regex.lastIndex;
  }

  // 残りのテキストを追加
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
