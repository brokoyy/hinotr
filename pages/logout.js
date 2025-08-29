import { useRouter } from "next/router";
import { useEffect } from "react";
import TopButton from "@/components/TopButton";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push("/");
    }, 500);
  }, [router]);

  return (
    <div className="p-6">
      <TopButton />
      <h1 className="text-xl font-bold mt-12">ログアウト中...</h1>
    </div>
  );
}
