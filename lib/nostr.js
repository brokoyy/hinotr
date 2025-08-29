// lib/nostr.js
import { relayInit, getEventHash, signEvent } from "nostr-tools";

export const DEFAULT_RELAYS = [
  "wss://relay.nostr.band/",
  "wss://relay-jp.nostr.wirednet.jp/",
  "wss://yabu.me/",
  "wss://r.kojira.io/"
];

let relays = [...DEFAULT_RELAYS];

export function setRelays(newRelays) {
  relays = newRelays;
}

export function getRelays() {
  return relays;
}

export async function publishEvent(event) {
  if (!window.nostr) throw new Error("NIP-07 not available");

  const signedEvent = await window.nostr.signEvent(event);
  const connections = relays.map(url => {
    const r = relayInit(url);
    r.on("error", () => console.log("relay error", url));
    r.on("connect", () => console.log("connected to", url));
    r.connect();
    return r;
  });

  connections.forEach(r => r.publish(signedEvent));
}
