import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Nostr クライアント</h1>
      <div className="flex flex-col gap-4">
        <button onClick={() => router.push("/profile")} className="p-2 bg-blue-500 text-white rounded">1 プロフィール</button>
        <button onClick={() => router.push("/relays")} className="p-2 bg-blue-500 text-white rounded">2 リレー設定</button>
        <button onClick={() => router.push("/timeline")} className="p-2 bg-blue-500 text-white rounded">3 タイムライン</button>
        <button onClick={() => router.push("/logout")} className="p-2 bg-blue-500 text-white rounded">4 ログアウト</button>
      </div>
    </div>
  );
}
