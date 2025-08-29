import { useEffect, useState } from "react";
import { relayPool } from "nostr-tools";

export default function Timeline({ pubkey, relays }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!pubkey) return;

    const pool = relayPool();
    relays.forEach((url) => pool.addRelay(url));

    const sub = pool.sub({
      filter: {
        kinds: [1],
        limit: 20,
      },
    });

    sub.on("event", (event) => {
      setEvents((prev) => {
        if (prev.find((e) => e.id === event.id)) return prev;
        return [event, ...prev].slice(0, 50);
      });
    });

    return () => {
      sub.unsub();
    };
  }, [pubkey, relays]);

  if (!events.length) return <p className="p-4">Loading timeline...</p>;

  return (
    <div className="p-4 space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start space-x-2 border-b pb-2"
        >
          <img
            src={`https://robohash.org/${event.pubkey}.png?size=50x50`}
            alt="icon"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="text-sm text-gray-500">{event.pubkey.slice(0, 8)}...</p>
            <p>{event.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
