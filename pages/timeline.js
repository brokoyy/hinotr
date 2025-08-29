// pages/timeline.js
import { useEffect, useState } from 'react';
import { defaultRelays, fetchProfile, postEvent } from '../lib/nostr';

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    const relays = defaultRelays.map(url => {
      const r = window.nostrTools.relayInit(url);
      r.connect();
      r.on('event', async (event) => {
        if (event.kind === 1) {
          setEvents(prev => [event, ...prev]);
          if (!profiles[event.pubkey]) {
            const p = await fetchProfile(event.pubkey);
            setProfiles(prev => ({ ...prev, [event.pubkey]: p }));
          }
        }
      });
      r.on('connect', () => {
        r.subscribe({ kinds: [1] });
      });
      return r;
    });

    return () => relays.forEach(r => r.close());
  }, []);

  async function sendMessage() {
    if (!message) return;
    const pubkey = await window.nostr.getPublicKey();
    const event = {
      kind: 1,
      content: message,
      pubkey,
      created_at: Math.floor(Date.now() / 1000)
    };
    event.id = window.nostrTools.getEventHash(event);
    event.sig = await window.nostr.signEvent(event);
    postEvent(event);
    setMessage('');
  }

  return (
    <div>
      <button onClick={() => window.location.href = '/'}>トップに戻る</button>
      <h2>タイムライン</h2>
      <div>
        <input 
          type="text" 
          value={message} 
          onChange={e => setMessage(e.target.value)} 
          placeholder="投稿内容" 
        />
        <button onClick={sendMessage}>送信</button>
      </div>
      <ul>
        {events.map((e, idx) => {
          const p = profiles[e.pubkey] || {};
          return (
            <li key={idx}>
              <img src={p.picture || '/default_icon.png'} width={40} height={40} alt="icon"/>
              <strong>{p.name || 'No Name'}</strong>: {e.content}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
