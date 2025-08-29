import { useRouter } from "next/router";

export default function Logout({ setPubkey }) {
  const router = useRouter();

  const handleLogout = () => {
    setPubkey(null);
    // ルートページへ戻す
    router.push("/");
  };

  return (
    <div className="p-4">
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded-lg"
      >
        ログアウト
      </button>
    </div>
  );
}
