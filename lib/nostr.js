// lib/nostr.js
import { relayInit, getEventHash, signEvent } from 'nostr-tools';

export const defaultRelays = [
  'wss://relay.nostr.band/',
  'wss://relay-jp.nostr.wirednet.jp/',
  'wss://yabu.me/',
  'wss://r.kojira.io/'
];

// キャッシュ用
const profileCache = {};

export async function fetchProfile(pubkey) {
  if (profileCache[pubkey]) return profileCache[pubkey];

  const relays = defaultRelays.map(url => relayInit(url));
  relays.forEach(r => r.connect());

  return new Promise((resolve) => {
    let resolved = false;
    relays.forEach(relay => {
      relay.on('event', (event) => {
        if (event.pubkey === pubkey && event.kind === 0 && !resolved) {
          profileCache[pubkey] = event.content ? JSON.parse(event.content) : {};
          resolved = true;
          resolve(profileCache[pubkey]);
          relays.forEach(r => r.close());
        }
      });
      relay.on('connect', () => {
        relay.subscribe({ kinds: [0], authors: [pubkey] });
      });
    });

    // タイムアウト処理（3秒）
    setTimeout(() => {
      if (!resolved) {
        profileCache[pubkey] = {};
        resolve({});
        relays.forEach(r => r.close());
      }
    }, 3000);
  });
}

export async function postEvent(event) {
  const relays = defaultRelays.map(url => relayInit(url));
  relays.forEach(r => r.connect());

  relays.forEach(relay => {
    relay.on('connect', () => {
      relay.publish(event);
    });
  });
}
