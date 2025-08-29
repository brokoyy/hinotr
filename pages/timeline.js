import { useEffect, useState } from "react";
import { relayInit, getEventHash, signEvent } from "nostr-tools";
import TopButton from "@/components/TopButton";

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [text, setText] = useState("");
  const relays = [
    "wss://relay.nostr.band/",
    "wss://relay-jp.nostr.wirednet.jp/",
    "wss://yabu.me/",
    "wss://r.kojira.io/",
  ];

  useEffect(() => {
    async function fetchTimeline() {
      const relay = relayInit(relays[0]);
      await relay.connect();

      const sub = relay.sub([{ kinds: [1], limit: 20 }]);

      sub.on("event", (event) => {
        setEvents((prev) => [event, ...prev]);
      });
    }
    fetchTimeline();
  }, []);

  const handleSubmit = async () => {
    if (!text) return;

    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: text,
      pubkey: "あなたの公開鍵をここに",
    };
    event.id = getEventHash(event);
    // 実際は署名が必要 → signEvent を呼ぶ
    // event.sig = signEvent(event, 秘密鍵);

    for (const url of relays) {
      const relay = relayInit(url);
      await relay.connect();
      relay.publish(event);
    }
    setText("");
  };

  return (
    <div className="p-6">
      <TopButton />
      <h1 className="text-xl font-bold mt-12">タイムライン</h1>
      <div className="mt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="投稿を書く..."
        />
        <button
          onClick={handleSubmit}
          className="mt-2 px-4 py-1 bg-green-500 text-white rounded"
        >
          投稿
        </button>
      </div>
      <div className="mt-6">
        {events.map((ev) => (
          <div key={ev.id} className="border-b py-2">
            {ev.content}
          </div>
        ))}
      </div>
    </div>
  );
}
