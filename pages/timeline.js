import { useEffect, useState } from 'react';
import { Relay } from 'nostr-tools';

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    const relays = ["wss://relay.damus.io", "wss://relay.nostr.band"];
    const subs = [];

    relays.forEach(url => {
      const relay = new Relay(url);
      relay.connect().then(() => {
        const sub = relay.sub([{ kinds: [1], limit: 20 }]);
        sub.on('event', (event) => {
          setEvents(prev => [event, ...prev].slice(0, 50));
        });
        subs.push(sub);
      });
    });

    return () => subs.forEach(sub => sub.unsub());
  }, []);

  return (
    <div className="p-4 space-y-4">
      {events.map((ev) => (
        <div key={ev.id} className="flex items-start space-x-3 border-b pb-3">
          <img
            src={profiles[ev.pubkey]?.picture || "/default-avatar.png"}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="font-bold">
              {profiles[ev.pubkey]?.name || ev.pubkey.slice(0, 8)}
            </div>
            <div>{ev.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
