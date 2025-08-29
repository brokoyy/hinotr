import TopButton from "@/components/TopButton";

export default function Relays() {
  const relays = [
    "wss://relay.nostr.band/",
    "wss://relay-jp.nostr.wirednet.jp/",
    "wss://yabu.me/",
    "wss://r.kojira.io/",
  ];

  return (
    <div className="p-6">
      <TopButton />
      <h1 className="text-xl font-bold mt-12">リレー設定</h1>
      <ul className="mt-4 list-disc pl-5">
        {relays.map((relay) => (
          <li key={relay}>{relay}</li>
        ))}
      </ul>
    </div>
  );
}
