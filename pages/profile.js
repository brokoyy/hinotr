import { useEffect, useState } from "react";
import { nip07Login, fetchProfileData } from "../lib/nostr";

export default function Profile({ setView }) {
  const [name, setName] = useState("No Name");

  useEffect(() => {
    (async () => {
      try {
        const pubkey = await nip07Login();
        const profileName = await fetchProfileData(pubkey);
        setName(profileName);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div>
      <button style={{ position: "fixed", top: 10, left: 10 }} onClick={() => setView("top")}>
        トップに戻る
      </button>
      <h2>プロフィール</h2>
      <p>{name}</p>
    </div>
  );
}
