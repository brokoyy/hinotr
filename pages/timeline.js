// pages/timeline.js
import React, { useEffect, useState } from "react";
import { getRelays, publishEvent } from "../lib/nostr";

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [content, setContent] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      const relays = getRelays();
      const connections = relays.map(url => {
        const r = window.nostr ? window.nostr : null; // Nostr接続確認
        return r;
      });
      // ここは簡易表示のためダミー
      setEvents([{ id: 1, content: "タイムラインサンプル投稿" }]);
    };
    fetchEvents();
  }, []);

  const handleSend = async () => {
    if (!content) return;
    const event = {
      kind: 1,
      content,
      created_at: Math.floor(Date.now() / 1000),
      tags: []
    };
    try {
      await publishEvent(event);
      setEvents(prev => [...prev, { id: prev.length + 1, content }]);
      setContent("");
    } catch (e) {
      console.error(e);
      alert("送信失敗");
    }
  };

  return (
    <div className="p-4">
      <button
        className="mb-4 bg-gray-200 p-2 rounded"
        onClick={() => (window.location.href = "/")}
      >
        トップに戻る
      </button>
      <div className="mb-4">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full border p-2"
          rows={3}
          placeholder="投稿内容"
        />
        <button
          onClick={handleSend}
          className="mt-2 bg-green-500 text-white p-2 rounded"
        >
          投稿
        </button>
      </div>
      <div>
        {events.map(e => (
          <div key={e.id} className="border-b py-1">
            {e.content}
          </div>
        ))}
      </div>
    </div>
  );
}
