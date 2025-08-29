import { SimplePool, getPublicKey, getProfile } from "nostr-tools";

export const DEFAULT_RELAYS = [
  "wss://relay.nostr.band/",
  "wss://relay-jp.nostr.wirednet.jp/",
  "wss://yabu.me/",
  "wss://r.kojira.io/"
];

export const pool = new SimplePool();

export const nip07Login = async () => {
  if (!window.nostr) throw new Error("NIP-07未対応のブラウザです");
  await window.nostr.requestSignEvent({ kind: 22242 }); // ダミー
  const pubkey = await getPublicKey(window.nostr);
  return pubkey;
};

export const fetchProfileData = async (pubkey) => {
  try {
    const data = await getProfile(pubkey, DEFAULT_RELAYS);
    return data?.name || "No Name";
  } catch (e) {
    console.error(e);
    return "No Name";
  }
};

export const postMessage = async (content) => {
  if (!window.nostr) throw new Error("ログインしてください");
  const event = {
    kind: 1,
    content,
    created_at: Math.floor(Date.now() / 1000),
    tags: []
  };
  const signed = await window.nostr.signEvent(event);
  pool.publish(DEFAULT_RELAYS, signed);
};

export const fetchTimeline = (onEvent) => {
  const sub = pool.sub(DEFAULT_RELAYS, [{ kinds: [1] }]);
  sub.on("event", onEvent);
  sub.on("eose", () => sub.unsub());
};
