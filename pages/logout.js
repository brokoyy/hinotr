import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("pubkey");
    // 少し待ってからトップへ戻る
    setTimeout(() => {
      router.push("/");
    }, 300);
  }, [router]);

  return <div className="p-4">Logging out...</div>;
}
