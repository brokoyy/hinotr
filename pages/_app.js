import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Link from "next/link";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 固定ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-gray-100 shadow p-2 z-50 flex justify-between items-center">
        <Link href="/">
          <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
            トップに戻る
          </button>
        </Link>
      </header>

      {/* コンテンツ部分 (ヘッダー分の余白を確保) */}
      <main className="flex-1 pt-16">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
