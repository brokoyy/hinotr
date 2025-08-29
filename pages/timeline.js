import { useEffect, useState } from "react";
import { relayInit, getEventHash, getPublicKey, signEvent } from "nostr-tools";

const relays = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social"
];

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    let subs = [];
    let relayConns = [];

    relays.forEach((url) => {
      const relay = relayInit(url);
      relay.connect().then(() => {
        console.log(`connected to ${url}`);
        const sub = relay.sub([{ kinds: [1], limit: 20 }]);
        subs.push(sub);

        sub.on("event", (event) => {
          setEvents((prev) => {
            const exists = prev.find((e) => e.id === event.id);
            if (exists) return prev;
            return [event, ...prev].slice(0, 50);
          });

          // プロフィール購読
          if (!profiles[event.pubkey]) {
            const profileSub = relay.sub([{ kinds: [0], authors: [event.pubkey], limit: 1 }]);
            profileSub.on("event", (profileEvent) => {
              try {
                const metadata = JSON.parse(profileEvent.content);
                setProfiles((prev) => ({
                  ...prev,
                  [event.pubkey]: metadata,
                }));
              } catch (e) {
                console.error("metadata parse error", e);
              }
            });
          }
        });
      });

      relayConns.push(relay);
    });

    return () => {
      subs.forEach((s) => s.unsub());
      relayConns.forEach((r) => r.close());
    };
  }, []);

  async function handlePost() {
    if (!window.nostr) {
      alert("NIP-07 extension required!");
      return;
    }
    const pubkey = await window.nostr.getPublicKey();
    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: newPost,
      pubkey,
    };
    event.id = getEventHash(event);
    event.sig = await window.nostr.signEvent(event);

    relays.forEach(async (url) => {
      const relay = relayInit(url);
      await relay.connect();
      let pub = relay.publish(event);
      pub.on("ok", () => {
        console.log(`${url} has accepted our event`);
      });
      pub.on("failed", (reason) => {
        console.log(`failed to publish to ${url}: ${reason}`);
      });
    });

    setNewPost("");
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Timeline</h1>

      {/* 投稿フォーム */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's happening?"
          className="flex-1 border rounded p-2"
        />
        <button
          onClick={handlePost}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Post
        </button>
      </div>

      {/* イベント表示 */}
      <div className="space-y-4">
        {events.map((e) => {
          const profile = profiles[e.pubkey] || {};
          return (
            <div
              key={e.id}
              className="p-3 border rounded flex items-start space-x-2"
            >
              {profile.picture ? (
                <img
                  src={profile.picture}
                  alt="avatar"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300" />
              )}
              <div>
                <p className="font-semibold">
                  {profile.name || e.pubkey.slice(0, 8)}
                </p>
                <p>{e.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
