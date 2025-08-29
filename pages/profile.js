import { useEffect, useState } from 'react';
import { getPublicKey } from 'nostr-tools';

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const pubkey = localStorage.getItem('pubkey');
    if (!pubkey) return;

    async function fetchProfile() {
      try {
        const metadata = JSON.parse(localStorage.getItem('profile') || '{}');
        setProfile(metadata);
      } catch (err) {
        console.error("プロフィール取得エラー:", err);
      }
    }
    fetchProfile();
  }, []);

  if (!profile) {
    return <div className="p-4">プロフィール情報がありません</div>;
  }

  return (
    <div className="flex flex-col items-center p-6">
      {profile.picture && (
        <img
          src={profile.picture}
          alt="avatar"
          className="w-24 h-24 rounded-full mb-4"
        />
      )}
      <h2 className="text-xl font-bold">{profile.name || 'No Name'}</h2>
    </div>
  );
}
