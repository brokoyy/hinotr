import { useState, useEffect } from 'react';
import { nip19 } from 'nostr-tools';
import type { AppMode, TimelinePost } from '../types/nostr';
import { pool, DEFAULT_RELAYS } from '../lib/nostr';
import type { Event as NostrEvent } from 'nostr-tools';

interface PostCardProps {
  post: TimelinePost;
  mode: AppMode;
}

interface Profile {
  name?: string;
  display_name?: string;
  picture?: string;
}

interface OgpData {
  title?: string;
  description?: string;
  image?: { url: string };
  url?: string;
}

const profileCache: Record<string, Profile> = {};

const IMAGE_REGEX = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s]*)?)/gi;
const VIDEO_REGEX = /(https?:\/\/[^\s]+?\.(?:mp4|webm|mov)(?:\?[^\s]*)?)/gi;
const GENERAL_URL_REGEX = /(https?:\/\/[^\s]+)/gi;

const NOSTR_BEACON_REGEX = /(nostr:)?(nevent1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+|note1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)/gi;
// npubを検出する正規表現
const NPUB_REGEX = /(nostr:)?(npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)/gi;

const getClientName = (tags: string[][]) => {
  const clientTag = tags?.find((tag) => tag[0] === 'client');
  return clientTag ? clientTag[1] : null;
};

function LinkCard({ url }: { url: string }) {
  const [ogp, setOgp] = useState<OgpData | null>(null);
  const [loading, setLoading] = useState(true);

  const getYouTubeInfo = (targetUrl: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = targetUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYouTubeInfo(url);

  useEffect(() => {
    let isMounted = true;
    if (youtubeId) {
      setLoading(false);
      return;
    }

    fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.status === 'success') {
          setOgp(data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [url, youtubeId]);

  if (youtubeId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl overflow-hidden transition-all duration-200 group my-2 text-slate-900 dark:text-slate-100"
      >
        <div className="flex flex-col sm:flex-row">
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt="YouTube thumbnail"
            className="w-full sm:w-48 h-32 object-cover flex-shrink-0"
          />
          <div className="p-3 flex flex-col justify-center min-w-0 flex-1">
            <span className="inline-block px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded w-max mb-1">
              YouTube
            </span>
            <h4 className="font-bold text-xs truncate group-hover:text-blue-500 dark:group-hover:text-blue-400">
              YouTube Video
            </h4>
            <span className="text-[10px] opacity-40 truncate mt-1">{url}</span>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl overflow-hidden transition-all duration-200 group my-2 text-slate-900 dark:text-slate-100"
    >
      {loading ? (
        <div className="p-3 text-xs opacity-50 truncate">プレビューを読み込み中... ({url})</div>
      ) : ogp && (ogp.title || ogp.image) ? (
        <div className="flex flex-col sm:flex-row">
          {ogp.image?.url && (
            <img
              src={ogp.image.url}
              alt="OGP preview"
              className="w-full sm:w-48 h-32 object-cover flex-shrink-0"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          <div className="p-3 flex flex-col justify-center min-w-0 flex-1">
            {ogp.title && (
              <h4 className="font-bold text-xs truncate group-hover:text-blue-500 dark:group-hover:text-blue-400">
                {ogp.title}
              </h4>
            )}
            {ogp.description && (
              <p className="text-xs opacity-60 line-clamp-2 my-1">
                {ogp.description}
              </p>
            )}
            <span className="text-[10px] opacity-40 truncate">{url}</span>
          </div>
        </div>
      ) : (
        <div className="p-3 text-xs text-blue-500 dark:text-blue-400 underline truncate">{url}</div>
      )}
    </a>
  );
}

function EmbeddedNoteCard({ beacon }: { beacon: string }) {
  const [targetEvent, setTargetEvent] = useState<NostrEvent | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const formatPubkey = (hex: string) => {
    try {
      const npub = nip19.npubEncode(hex);
      return `@${npub.slice(0, 8)}...${npub.slice(-4)}`;
    } catch {
      return `@${hex.slice(0, 6)}...`;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchTarget = async () => {
      try {
        let eventId = '';
        const cleanBeacon = beacon.replace(/^nostr:/, '');
        
        if (cleanBeacon.startsWith('note1') || cleanBeacon.startsWith('nevent1')) {
          const decoded = nip19.decode(cleanBeacon);
          if (decoded.type === 'note') {
            eventId = decoded.data;
          } else if (decoded.type === 'nevent') {
            eventId = decoded.data.id;
          }
        }

        if (!eventId) {
          if (isMounted) setLoading(false);
          return;
        }

        const event = await pool.get(DEFAULT_RELAYS, { ids: [eventId] });
        if (event && isMounted) {
          setTargetEvent(event);

          if (profileCache[event.pubkey]) {
            setProfile(profileCache[event.pubkey]);
          } else {
            const profileEvent = await pool.get(DEFAULT_RELAYS, { kinds: [0], authors: [event.pubkey] });
            if (profileEvent && isMounted) {
              const data = JSON.parse(profileEvent.content);
              const userProfile: Profile = {
                name: data.name,
                display_name: data.display_name,
                picture: data.picture,
              };
              profileCache[event.pubkey] = userProfile;
              setProfile(userProfile);
            }
          }
        }
      } catch (e) {
        console.error('引用投稿の取得失敗:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTarget();
    return () => {
      isMounted = false;
    };
  }, [beacon]);

  if (loading) {
    return (
      <div 
        className="my-2 p-3 rounded-xl text-xs animate-pulse"
        style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#94a3b8', borderWidth: '1px' }}
      >
        引用投稿を読み込み中... ({beacon.slice(0, 16)}...)
      </div>
    );
  }

  if (!targetEvent) {
    return (
      <div 
        className="my-2 p-3 rounded-xl text-xs font-mono"
        style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#94a3b8', borderWidth: '1px' }}
      >
        引用投稿が見つかりませんでした ({beacon})
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.name || targetEvent.pubkey.slice(0, 8);

  return (
    <div 
      className="my-2 p-3 rounded-xl text-xs space-y-2 shadow-sm"
      style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderWidth: '1px' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {profile?.picture ? (
            <img src={profile.picture} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-700" />
          )}
          <span className="font-bold truncate max-w-[120px]">{displayName}</span>
          <span style={{ color: '#94a3b8' }}>{formatPubkey(targetEvent.pubkey)}</span>
        </div>
      </div>
      <p className="line-clamp-3 whitespace-pre-wrap" style={{ color: '#e2e8f0' }}>
        {targetEvent.content}
      </p>
    </div>
  );
}

// ユーザー名解決用の小さなコンポーネント（本文中の npub を `@表示名` に変換する）
function MentionTextRenderer({ text }: { text: string }) {
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    const matches = Array.from(text.matchAll(NPUB_REGEX));
    if (matches.length === 0) return;

    const npubList = Array.from(new Set(matches.map((m) => m[2])));

    const fetchNames = async () => {
      const newMap: Record<string, string> = {};
      const pubkeysToFetch: string[] = [];
      const npubToPubkey: Record<string, string> = {};

      npubList.forEach((npub) => {
        try {
          const decoded = nip19.decode(npub);
          if (decoded.type === 'npub') {
            const pk = decoded.data;
            npubToPubkey[npub] = pk;
            if (profileCache[pk]) {
              newMap[npub] = profileCache[pk].display_name || profileCache[pk].name || `@${npub.slice(0, 8)}...`;
            } else {
              pubkeysToFetch.push(pk);
            }
          }
        } catch (e) {}
      });

      if (isMounted && Object.keys(newMap).length > 0) {
        setResolvedNames((prev) => ({ ...prev, ...newMap }));
      }

      if (pubkeysToFetch.length > 0) {
        try {
          const events = await pool.querySync(DEFAULT_RELAYS, {
            kinds: [0],
            authors: pubkeysToFetch,
          } as any);

          const fetchedMap: Record<string, string> = {};
          events.forEach((ev) => {
            try {
              const data = JSON.parse(ev.content);
              const name = data.display_name || data.name;
              const npub = nip19.npubEncode(ev.pubkey);
              if (name) {
                fetchedMap[npub] = name;
                profileCache[ev.pubkey] = { name: data.name, display_name: data.display_name, picture: data.picture };
              }
            } catch (e) {}
          });

          if (isMounted) {
            setResolvedNames((prev) => ({ ...prev, ...fetchedMap }));
          }
        } catch (e) {}
      }
    };

    fetchNames();
    return () => {
      isMounted = false;
    };
  }, [text]);

  // npub部分をパースして綺麗に置換
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(NPUB_REGEX);
  let match;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const npub = match[2];
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      parts.push(text.slice(lastIndex, startIndex));
    }

    const displayName = resolvedNames[npub] || `@${npub.slice(0, 8)}...`;
    parts.push(
      <span key={startIndex} className="text-blue-400 font-semibold bg-blue-500/10 px-1 rounded">
        @{displayName}
      </span>
    );

    lastIndex = startIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
}

export function PostCard({ post, mode }: PostCardProps) {
  const [profile, setProfile] = useState<Profile | null>(
    profileCache[post.pubkey] || null
  );
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  const fetchedReactions: NostrEvent[] = (post as any).reactions || [];

  const [myReaction, setMyReaction] = useState<string | null>(() => {
    try {
      const localSaved = localStorage.getItem(`hinotr_reaction_${post.id}`);
      if (localSaved) return localSaved;
    } catch {}
    return null;
  });

  const [hasMyReactionOnRelay, setHasMyReactionOnRelay] = useState(false);

  useEffect(() => {
    if (window.nostr && typeof window.nostr.getPublicKey === 'function') {
      window.nostr.getPublicKey().then((pubkey) => {
        if (pubkey) {
          const myExistingReactionEvent = fetchedReactions.find((r) => r.pubkey === pubkey);
          if (myExistingReactionEvent) {
            setHasMyReactionOnRelay(true);
            const emoji = myExistingReactionEvent.content.trim() === '' ? '♡' : myExistingReactionEvent.content;
            setMyReaction(emoji);
            try {
              localStorage.setItem(`hinotr_reaction_${post.id}`, emoji);
            } catch {}
          }
        }
      }).catch(() => {});
    }
  }, [fetchedReactions, post.id]);

  const totalFetchedCount = fetchedReactions.length;
  const isLocalStorageActive = !!myReaction && !hasMyReactionOnRelay;
  const finalDisplayCount = isLocalStorageActive ? totalFetchedCount + 1 : totalFetchedCount;
  const displayEmoji = myReaction ? myReaction : '♡';

  useEffect(() => {
    if (profileCache[post.pubkey]) {
      setProfile(profileCache[post.pubkey]);
      return;
    }

    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const event = await pool.get(DEFAULT_RELAYS, {
          kinds: [0],
          authors: [post.pubkey],
        });

        if (event && isMounted) {
          const data = JSON.parse(event.content);
          const userProfile: Profile = {
            name: data.name,
            display_name: data.display_name,
            picture: data.picture,
          };
          profileCache[post.pubkey] = userProfile;
          setProfile(userProfile);
        }
      } catch (e) {
        console.error('プロフィール取得失敗:', e);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [post.pubkey]);

  const handleReactionClick = async () => {
    if (mode === 'HINOTORI' || !window.nostr || isReacting) return;

    const nextEmoji = Math.random() < 0.5 ? '🎤' : '🎸';
    const prevReaction = myReaction;

    setIsReacting(true);
    setMyReaction(nextEmoji);
    try {
      localStorage.setItem(`hinotr_reaction_${post.id}`, nextEmoji);
    } catch {}

    try {
      const template = {
        kind: 7,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', post.id],
          ['p', post.pubkey],
          ['client', 'hinotr'],
        ],
        content: nextEmoji,
      };
      const signedEvent = await window.nostr.signEvent(template);
      await pool.publish(DEFAULT_RELAYS, signedEvent);
    } catch (e) {
      console.error('リアクション失敗:', e);
      setMyReaction(prevReaction);
      try {
        if (prevReaction) {
          localStorage.setItem(`hinotr_reaction_${post.id}`, prevReaction);
        } else {
          localStorage.removeItem(`hinotr_reaction_${post.id}`);
        }
      } catch {}
    } finally {
      setIsReacting(false);
    }
  };

  const handleSendReply = async () => {
    if (mode === 'HINOTORI' || !window.nostr || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const template = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', post.id, '', 'reply'],
          ['p', post.pubkey],
          ['client', 'hinotr'],
        ],
        content: replyText,
      };
      const signedEvent = await window.nostr.signEvent(template);
      await pool.publish(DEFAULT_RELAYS, signedEvent);
      setReplyText('');
      setShowReplyBox(false);
    } catch (e) {
      console.error('リプライ失敗:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const formatNpub = (hexKey: string) => {
    try {
      const npub = nip19.npubEncode(hexKey);
      return `@${npub.slice(0, 12)}...${npub.slice(-8)}`;
    } catch (e) {
      return `@${hexKey.slice(0, 8)}...${hexKey.slice(-8)}`;
    }
  };

  const renderContent = (content: string) => {
    const beacons: string[] = (content.match(NOSTR_BEACON_REGEX) || []) as string[];
    const images: string[] = (content.match(IMAGE_REGEX) || []) as string[];
    const videos: string[] = (content.match(VIDEO_REGEX) || []) as string[];
    
    let textOnly = content
      .replace(NOSTR_BEACON_REGEX, '')
      .replace(IMAGE_REGEX, '')
      .replace(VIDEO_REGEX, '')
      .trim();

    const matchedUrls: string[] = (textOnly.match(GENERAL_URL_REGEX) || []) as string[];
    const otherUrls = matchedUrls.filter(
      (url: string) => !images.includes(url) && !videos.includes(url)
    );

    return (
      <div>
        <p className="whitespace-pre-wrap break-words">
          <MentionTextRenderer text={textOnly} />
        </p>
        
        {beacons.map((beacon, i) => (
          <EmbeddedNoteCard key={i} beacon={beacon} />
        ))}

        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt="media"
            className="mt-2 rounded-lg max-h-96 object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ))}

        {videos.map((vid, i) => (
          <video
            key={i}
            src={vid}
            controls
            className="mt-2 rounded-lg max-h-96 w-full"
          />
        ))}

        {otherUrls.map((url, i) => (
          <LinkCard key={i} url={url} />
        ))}
      </div>
    );
  };

  const displayName = profile?.display_name || profile?.name || post.pubkey.slice(0, 8);

  return (
    <div
      className={`p-4 transition-opacity duration-1000 ${
        post.isFading ? 'opacity-20' : 'opacity-100'
      }`}
      style={{ borderBottom: '1px solid #1e293b' }}
    >
      <div className="flex items-start gap-3">
        {profile?.picture ? (
          <img
            src={profile.picture}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold truncate">{displayName}</span>
              <span className="text-xs opacity-50 truncate">
                {formatNpub(post.pubkey)}
              </span>
            </div>
            <span className="text-xs opacity-50 flex-shrink-0">
              {formatTimestamp(post.created_at)}
            </span>
          </div>

          {renderContent(post.content)}

          {mode === 'PHANTOM' && (
            <div className="flex items-center justify-between mt-3 text-xs opacity-70">
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => setShowReplyBox(!showReplyBox)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700 hover:border-slate-500 hover:text-blue-500 transition-colors"
                >
                  <span>💬</span> <span>返信</span>
                </button>
                
                <button
                  onClick={() => confirm('この投稿をリポストしますか？') && alert('リポスト機能は調整中です')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700 hover:border-slate-500 hover:text-green-500 transition-colors"
                >
                  <span>🔁</span> <span>リポスト</span>
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReactionClick}
                    disabled={isReacting}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                      myReaction 
                        ? 'border-red-500 text-red-500 bg-red-500/10' 
                        : 'border-slate-700 hover:border-slate-500 hover:text-red-500'
                    }`}
                  >
                    <span>{displayEmoji}</span>
                    <span className="text-xs font-bold">{finalDisplayCount}</span>
                  </button>
                </div>
              </div>

              {getClientName(post.tags) && (
                <span className="opacity-60 text-[11px]">
                  via <span className="font-semibold">{getClientName(post.tags)}</span>
                </span>
              )}
            </div>
          )}

          {showReplyBox && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="返信を入力..."
                className="flex-1 px-3 py-1 text-sm rounded border border-slate-300 dark:border-slate-700 bg-transparent"
              />
              <button
                onClick={handleSendReply}
                disabled={isSubmitting}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
              >
                送信
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
