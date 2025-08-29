import { useEffect, useState } from 'react';
import useNostr from '../utils/useNostr';
import { generatePrivateKey, getEventHash, getSignature } from 'nostr-tools';

export default function Timeline() {
  const { pubkey, relays } = useNostr();
  const [events, setEvents] = useState([]);
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    if (!pubkey || relays.length === 0) return;

    const subs = relays.map((relay) => {
      const sub = relay.sub([{ kinds: [1], limit: 20 }]);
      sub.on('event', (event) => {
        setEvents((prev) => {
          if (prev.find((e) => e.id === event.id)) return prev;
          return [event, ...prev].slice(0, 50);
        });
      });
      return sub;
    });

    return () => {
      subs.forEach((sub) => sub.unsub());
    };
  }, [pubkey, relays]);

  const handleSend = async () => {
    if (!newPost.trim() || relays.length === 0) return;

    const event = {
      kind: 1,
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: newPost,
    };

    event.id = getEventHash(event);
    event.sig = await window.nostr.signEvent(event);

    relays.forEach((relay) => relay.publish(event));

    setNewPost("");
  };

  return (
    <div className="p-6 space-y-6">
      {/* 投稿フォーム */}
      <div className="flex space-x-2">
        <input
          type="text"
          className="flex-1 border p-2 rounded"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's happening?"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Post
        </button>
      </div>

      {/* タイムライン */}
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex items-start space-x-3 border-b pb-2">
            <img
              src="/icon.png"
              alt="icon"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-semibold">{event.pubkey.slice(0, 10)}...</p>
              <p>{event.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
