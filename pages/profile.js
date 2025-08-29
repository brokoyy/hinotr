import { useEffect, useState } from 'react';
import useNostr from '../utils/useNostr';

export default function Profile() {
  const { pubkey, relays } = useNostr();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!pubkey || relays.length === 0) return;

    relays.forEach((relay) => {
      const sub = relay.sub([{ kinds: [0], authors: [pubkey] }]);
      sub.on('event', (event) => {
        try {
          const content = JSON.parse(event.content);
          setProfile({
            name: content.display_name || content.name || "No Name",
            picture: content.picture || null,
          });
        } catch (e) {
          console.error("Failed to parse profile", e);
        }
      });
    });
  }, [pubkey, relays]);

  return (
    <div className="p-6">
      {profile ? (
        <div className="flex items-center space-x-4">
          {profile.picture && (
            <img src={profile.picture} alt="icon" className="w-16 h-16 rounded-full" />
          )}
          <h2 className="text-xl font-bold">{profile.name}</h2>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}
