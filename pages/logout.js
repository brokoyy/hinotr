import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useNostr from '../utils/useNostr';

export default function Logout() {
  const router = useRouter();
  const { setPubkey } = useNostr();

  useEffect(() => {
    setPubkey(null);
    setTimeout(() => {
      router.push('/');
    }, 500);
  }, []);

  return (
    <div className="p-6">
      <p>Logging out...</p>
    </div>
  );
}
