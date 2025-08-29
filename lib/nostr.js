// lib/nostr.js
import React, { createContext, useState, useEffect } from "react";

// ---- Context & Provider ----
export const NostrContext = createContext();

export function NostrProvider({ children }) {
  const [pubkey, setPubkey] = useState(null);
  const [relays, setRelays] = useState([
    "wss://relay.damus.io",
    "wss://relay.snort.social",
  ]);

  useEffect(() => {
    // localStorage から復元
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pubkey");
      if (saved) setPubkey(saved);

      const storedRelays = localStorage.getItem("relays");
      if (storedRelays) {
        try {
          setRelays(JSON.parse(storedRelays));
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (pubkey) localStorage.setItem("pubkey", pubkey);
      else localStorage.removeItem("pubkey");
    }
  }, [pubkey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("relays", JSON.stringify(relays));
    }
  }, [relays]);

  return (
    <NostrContext.Provider value={{ pubkey, setPubkey, relays, setRelays }}>
      {children}
    </NostrContext.Provider>
  );
}

// ---- NIP-07 Login ----
export async function nip07Login() {
  if (typeof window === "undefined" || !window.nostr) {
    throw new Error("NIP-07 extension not found (use a Nostr wallet like nos2x)");
  }
  const pubkey = await window.nostr.getPublicKey();
  return pubkey;
}

// ---- Identicon fallback ----
export function identiconSvg(pubkey, size = 80) {
  // シンプルなダミー identicon
  const color = "#" + pubkey.slice(0, 6);
  return `data:image/svg+xml;utf8,
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="${color}" />
      <text x="50%" y="55%" font-size="${size / 3}" text-anchor="middle" fill="white">${pubkey.slice(0, 4)}</text>
    </svg>`;
}
