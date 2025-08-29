import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SimplePool } from "nostr-tools";

const relays = [
  "wss://relay.nostr.band",
  "wss://relay-jp.nostr.wirednet.jp",
  "wss://yabu.me",
  "wss://r.kojira.io"
];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const pubkey = localStorage.getItem("pubkey");
    if (!pubkey) {
      router.push("/");
      return;
    }

    const pool = new SimplePool();
    const sub = pool.sub(relays, [{ kinds: [0], authors: [pubkey] }]);

    sub.on("event", (event) => {
      try {
        const content = JSON.parse(event.content);
        setProfile(content);
      } catch (e) {
        console.error("Invalid profile event:", e);
      }
    });

    return () => {
      sub.unsub();
      pool.close(relays);
    };
  }, [router]);

  if (!profile) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 flex flex-col items-center">
      {profile.picture && (
        <img
          src={profile.picture}
          alt="icon"
          className="w-24 h-24 rounded-full mb-2"
        />
      )}
      <h2 className="text-lg font-bold">
        {profile.display_name || profile.name || "No Name"}
      </h2>
    </div>
  );
}
