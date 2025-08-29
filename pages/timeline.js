"use client";
import { useEffect, useState } from "react";
import { SimplePool, nip19 } from "nostr-tools";

const relays = [
  "wss://relay.damus.io",
  "wss://relay.snort.social",
  "wss://relay.nostr.band",
];

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [profiles, setProfiles] = useState({});
  const pool = new SimplePool();

  useEffect(() => {
    // タイムライン購読
    const sub = pool.subscribeMany(
      relays,
      [
        {
          kinds: [1], // テキストイベント
          limit: 30,
        },
      ],
      {
        onevent: (event) => {
          setEvents((prev) => {
            // 重複防止
            if (prev.find((e) => e.id === event.id)) return prev;
            return [event, ...prev].slice(0, 30);
          });

          // プロフィール未取得なら NIP-01 kind=0 を購読
          if (!profiles[event.pubkey]) {
            pool.subscribeMany(relays, [{ kinds: [0], authors: [event.pubkey], limit: 1 }], {
              onevent: (profileEvent) => {
                try {
                  const metadata = JSON.parse(profileEvent.content);
                  setProfiles((prev) => ({
                    ...prev,
                    [event.pubkey]: metadata,
                  }));
                } catch (e) {
                  console.error("プロフィールJSONの解析に失敗:", e);
                }
              },
            });
          }
        },
      }
    );

    return () => {
      sub.close();
      pool.close(relays);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-xl font-bold mb-4">Timeline</h1>
      <div className="space-y-4">
        {events.map((event) => {
          const profile = profiles[event.pubkey] || {};
          return (
            <div
              key={event.id}
              className="bg-white shadow p-4 rounded-2xl flex items-start gap-3"
            >
              {/* アイコン */}
              {profile.picture ? (
                <img
                  src={profile.picture}
                  alt="avatar"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300" />
              )}

              {/* 本文 */}
              <div>
                <p className="font-semibold">
                  {profile.name || nip19.npubEncode(event.pubkey).slice(0, 12) + "..."}
                </p>
                <p className="text-gray-700">{event.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
