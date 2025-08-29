// pages/profile.js
import { useEffect, useState } from 'react';
import { fetchProfile } from '../lib/nostr';
import { getPublicKey } from '../lib/nostr'; // NIP-07から取得する関数

export default function Profile() {
  const [profile, setProfile] = useState({});
  const [pubkey, setPubkey] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const pk = await window.nostr.getPublicKey();
      setPubkey(pk);
      const p = await fetchProfile(pk);
      setProfile(p);
    }
    loadProfile();
  }, []);

  return (
    <div>
      <button onClick={() => window.location.href = '/'}>トップに戻る</button>
      <h2>プロフィール</h2>
      {pubkey ? (
        <div>
          <img src={profile.picture || '/default_icon.png'} alt="icon" width={50} height={50}/>
          <p>{profile.name || 'No Name'}</p>
        </div>
      ) : (
        <p>ログインしてください</p>
      )}
    </div>
  );
}
