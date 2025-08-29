import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    // ログアウト処理（特にNIP-07は秘密鍵を保存しないのでセッションだけリセット）
    localStorage.removeItem("loggedIn");
    router.push("/");
  }, [router]);

  return <p>Logging out...</p>;
}
