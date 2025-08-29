import { useRouter } from "next/router";

export default function TopButton() {
  const router = useRouter();

  return (
    <div className="fixed top-0 left-0 w-full bg-gray-800 text-white p-2 flex justify-center shadow-md z-50">
      <button
        onClick={() => router.push("/")}
        className="px-4 py-1 bg-blue-500 rounded"
      >
        トップに戻る
      </button>
    </div>
  );
}
