// lib/nostr.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { SimplePool } from 'nostr-tools/pool'

// ===== デフォルトリレー（ユーザー要望）=====
export const DEFAULT_RELAYS = [
  'wss://relay.nostr.band/',
  'wss://relay-jp.nostr.wirednet.jp/',
  'wss://yabu.me/',
  'wss://r.kojira.io/'
]

// ---- 小さめアイコン用の簡易アイデンティコン ----
function simpleHash(str){
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
export function identiconSvg(pk, size = 40) {
  const h = simpleHash(pk)
  const hue = h % 360
  const bg = `hsl(${hue},70%,92%)`
  const fg = `hsl(${(hue + 180) % 360},70%,30%)`
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 10 10'>`+
    `<rect width='10' height='10' fill='${bg}'/>`+
    Array.from({length:25}).map((_,i)=>{
      const x=i%5,y=(i/5|0); const on=((h>>(i%32))&1)===1
      const rx = x<3? x : 4-x
      return on? `<rect x='${rx+2}' y='${y}' width='1' height='1' fill='${fg}'/>`:''
    }).join('')+
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// ---- NIP-07 ログイン（コンテキスト外でも使えるようエクスポート）----
export async function nip07Login() {
  if (typeof window === 'undefined' || !window.nostr) throw new Error('NIP-07 extension not found')
  return await window.nostr.getPublicKey()
}

// ---- Context ----
export const NostrContext = createContext(null)

export function NostrProvider({ children }) {
  const poolRef = useRef(null)
  if (!poolRef.current) poolRef.current = new SimplePool()
  const pool = poolRef.current

  const [pubkey, setPubkey] = useState(null)
  const [relays, _setRelays] = useState(DEFAULT_RELAYS)

  // keep simple caches in memory
  const profileCache = useRef(new Map()) // pubkey -> {name, about, picture}

  // 初期化（SSG/SSR安全）
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedRelays = JSON.parse(localStorage.getItem('hinotr_relays') || '[]')
      if (Array.isArray(savedRelays) && savedRelays.length) _setRelays(savedRelays)
    } catch {}
    const savedPub = localStorage.getItem('hinotr_pubkey')
    if (savedPub) setPubkey(savedPub)
  }, [])

  // 永続化
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('hinotr_relays', JSON.stringify(relays))
  }, [relays])
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pubkey) localStorage.setItem('hinotr_pubkey', pubkey)
    else localStorage.removeItem('hinotr_pubkey')
  }, [pubkey])

  const setRelays = (arr) => {
    const cleaned = (arr || []).map(s => (s || '').trim()).filter(Boolean)
    _setRelays(cleaned.length ? cleaned : DEFAULT_RELAYS)
  }

  const login = async () => {
    const pk = await nip07Login()
    setPubkey(pk)
    return pk
  }

  const logout = () => {
    setPubkey(null)
    // 他に状態があればここでクリア
  }

  // kind:0 を取得（キャッシュ付）
  const getProfile = async (pk) => {
    if (!pk) return null
    const cached = profileCache.current.get(pk)
    if (cached) return cached
    try {
      const evt = await pool.get(relays, { kinds:[0], authors:[pk] })
      if (evt) {
        const j = JSON.parse(evt.content || '{}')
        const prof = {
          name: j.display_name || j.name || null,
          about: j.about || '',
          picture: j.picture || null
        }
        profileCache.current.set(pk, prof)
        return prof
      }
    } catch (e) {
      console.warn('profile fetch failed', e)
    }
    const fallback = { name: null, about: '', picture: null }
    profileCache.current.set(pk, fallback)
    return fallback
  }

  // タイムライン購読（複数リレー同時）
  const subscribeTimeline = (filters, { onEvent, onEose } = {}) => {
    return pool.subscribeMany(relays, filters, {
      onevent: (evt, url) => { onEvent && onEvent(evt, url) },
      oneose: () => { onEose && onEose() }
    })
  }

  // 投稿（NIP-07 署名 → 2の設定リレーへ publish）
  const publishNote = async (content) => {
    if (!content?.trim()) throw new Error('empty content')
    if (typeof window === 'undefined' || !window.nostr) throw new Error('NIP-07 not available')
    const base = {
      kind: 1,
      created_at: Math.floor(Date.now()/1000),
      tags: [],
      content,
      pubkey
    }
    const signed = await window.nostr.signEvent(base) // id/sig 付与
    await pool.publish(relays, signed)               // 全リレーへ投げる
    return signed
  }

  const value = {
    pubkey, setPubkey,
    login, logout,
    nip07Login, // 互換のため
    relays, setRelays,
    pool,
    getProfile,
    subscribeTimeline,
    publishNote,
    identiconSvg,
    DEFAULT_RELAYS
  }

  return <NostrContext.Provider value={value}>{children}</NostrContext.Provider>
}
