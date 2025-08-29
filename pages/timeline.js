import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SimplePool } from "nostr-tools";

const relays = [
  "wss://relay.nostr.band",
  "wss://relay-jp.nostr.wirednet.jp",
  "wss://yabu.me",
  "wss://r.kojira.io"
];

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [profiles, setProfiles] = useState({});
  const router = useRouter();

  useEffect(() => {
    const pubkey = localStorage.getItem("pubkey");
    if (!pubkey) {
      router.push("/");
      return;
    }

    const pool = new SimplePool();
    const sub = pool.sub(relays, [{ kinds: [1], limit: 20 }]);

    sub.on("event", (event) => {
      setEvents((prev) => {
        if (prev.find((e) => e.id === event.id)) return prev;
        return [event, ...prev].slice(0, 50);
      });

      // fetch profile if not cached
      if (!profiles[event.pubkey]) {
        const ps = pool.sub(relays, [{ kinds: [0], authors: [event.pubkey] }]);
        ps.on("event", (pe) => {
          try {
            setProfiles((prev) => ({
              ...prev,
              [event.pubkey]: JSON.parse(pe.content),
            }));
          } catch (e) {}
        });
      }
    });

    return () => {
      sub.unsub();
      pool.close(relays);
    };
  }, [router]);

  return (
    <div className="p-4 space-y-4">
      {events.map((ev) => {
        const profile = profiles[ev.pubkey] || {};
        return (
          <div key={ev.id} className="flex items-start space-x-2 border-b pb-2">
            {profile.picture ? (
              <img
                src={profile.picture}
                alt="icon"
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full" />
            )}
            <div>
              <p className="font-bold text-sm">
                {profile.display_name || profile.name || ev.pubkey.slice(0, 8)}
              </p>
              <p className="text-sm whitespace-pre-wrap">{ev.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
