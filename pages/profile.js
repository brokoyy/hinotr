import { useEffect, useState } from "react";
import { relayInit } from "nostr-tools";

export default function Profile({ pubkey, relays }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!pubkey) return;
    async function fetchProfile() {
      const relay = relayInit(relays[0]);
      await relay.connect();

      relay.on("connect", () => {
        console.log(`connected to ${relay.url}`);
      });

      relay.on("error", () => {
        console.log(`failed to connect to ${relay.url}`);
      });

      let sub = relay.sub([
        {
          kinds: [0],
          authors: [pubkey],
          limit: 1,
        },
      ]);

      sub.on("event", (event) => {
        try {
          const metadata = JSON.parse(event.content);
          setProfile(metadata);
        } catch (e) {
          console.error("Failed to parse metadata", e);
        }
      });

      sub.on("eose", () => {
        sub.unsub();
      });
    }
    fetchProfile();
  }, [pubkey, relays]);

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="p-4">
      <img
        src={profile.picture}
        alt="icon"
        className="w-16 h-16 rounded-full mb-2"
      />
      <h2 className="text-xl font-bold">{profile.name || "No Name"}</h2>
    </div>
  );
}
