import { useEffect, useState } from "react";
import { relayInit } from "nostr-tools";
import TopButton from "@/components/TopButton";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const relays = [
    "wss://relay.nostr.band/",
    "wss://relay-jp.nostr.wirednet.jp/",
    "wss://yabu.me/",
    "wss://r.kojira.io/",
  ];

  useEffect(() => {
    async function fetchProfile() {
      const relay = relayInit(relays[0]);
      await relay.connect();

      const sub = relay.sub([
        { kinds: [0], authors: ["あなたの公開鍵をここに"] }
      ]);

      sub.on("event", (event) => {
        try {
          const metadata = JSON.parse(event.content);
          setProfile(metadata);
        } catch {
          setProfile({});
        }
        sub.unsub();
      });
    }
    fetchProfile();
  }, []);

  return (
    <div className="p-6">
      <TopButton />
      <h1 className="text-xl font-bold mt-12">プロフィール</h1>
      {profile ? (
        <div className="mt-4">
          <p>名前: {profile.name || "No Name"}</p>
          <p>自己紹介: {profile.about || "なし"}</p>
        </div>
      ) : (
        <p>読み込み中...</p>
      )}
    </div>
  );
}
