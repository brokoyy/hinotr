import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem('pubkey');
    localStorage.removeItem('profile');
    router.push('/');
  }, [router]);

  return <div className="p-4">ログアウト中...</div>;
}
