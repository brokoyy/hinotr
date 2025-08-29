// pages/logout.js
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    // ローカル状態などがあればここでリセット
    // 例: window.localStorage.removeItem("nip07_account");
    
    // 0.5秒後にトップに戻す
    const timer = setTimeout(() => {
      router.push("/"); // トップページに戻る
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>ログアウトしました</h1>
      <p>トップページに戻ります…</p>
    </div>
  );
}
