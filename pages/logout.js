// pages/logout.js
import { useEffect } from "react";

export default function Logout() {
  useEffect(() => {
    localStorage.removeItem("nip07LoggedIn"); // ローカル保存してる場合
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  }, []);

  return (
    <div className="p-4">
      <p>ログアウト中...</p>
    </div>
  );
}
