import React from 'react'
export async function ensureRelay(url){
const relay = relayInit(url)
try{
await relay.connect()
return relay
}catch(e){
console.warn('relay connect failed', url, e)
return null
}
}


// Subscribe to notes (kind:1) on multiple relays. callback is called with event and relayUrl.
export async function subscribeNotes(relayUrls, onEvent){
const relays = {}
const subs = []


for(let url of relayUrls){
try{
const r = relayInit(url)
await r.connect()
relays[url] = r


const sub = r.sub([{ kinds:[1], limit:50 }])
sub.on('event', ev => onEvent(ev, url))
sub.on('error', e => console.warn('sub error', url, e))
subs.push({ relay:r, sub })
}catch(e){
console.warn('subscribe failed', url, e)
}
}


return {
relays,
subs,
close(){ subs.forEach(s => { try{ s.sub.unsub() }catch(e){}; try{ s.relay.close() }catch(e){} }) }
}
}


// Subscribe to metadata (kind:0) for given pubkeys, across relays
export async function subscribeMetadata(pubkeys, relayUrls, onMeta){
const work = []
for(let url of relayUrls){
try{
const r = relayInit(url)
await r.connect()
const sub = r.sub([{ kinds:[0], authors: pubkeys }])
sub.on('event', ev => {
try{ const parsed = JSON.parse(ev.content); onMeta(ev.pubkey, parsed, url) }catch(e){ console.warn('meta parse', e) }
})
sub.on('eose', ()=> sub.unsub())
}catch(e){ console.warn('meta sub fail', url, e) }
}
}


// Publish an event using NIP-07 signEvent (preferred). event should include kind, content, tags, created_at.
export async function publishWithNip07(event, relayUrls){
if (typeof window === 'undefined') throw new Error('client only')
if (!window.nostr || !window.nostr.signEvent) throw new Error('NIP-07 signing not available')


// signEvent returns signed event with id and sig
const signed = await window.nostr.signEvent(event)


// publish to relays
for(let url of relayUrls){
try{
const r = relayInit(url)
await r.connect()
const pub = r.publish(signed)
pub.on('ok', () => console.log('published to', url))
pub.on('failed', reason => console.warn('publish failed', url, reason))
}catch(e){ console.warn('publish error', url, e) }
}
}


// Build a reaction event (kind 7)
export function makeReaction(pubkey, eventId, eventPubkey, emoji='❤️'){
const ev = {
kind:7,
content: emoji,
tags: [['e', eventId], ['p', eventPubkey]],
created_at: Math.floor(Date.now()/1000),
pubkey
}
ev.id = getEventHash(ev)
return ev
}
