"use client";
import { useRouter } from "next/navigation";

export default function Logout() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("nostr_key"); // 保存してた秘密鍵などを削除
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <button
        onClick={handleLogout}
        className="px-6 py-3 bg-red-500 text-white rounded-2xl shadow"
      >
        ログアウト
      </button>
    </div>
  );
}
