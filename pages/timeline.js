import React, { useContext, useEffect, useRef, useState } from 'react'
import { NostrContext, identiconSvg } from '../lib/nostr'
import { useRouter } from 'next/router'

export default function Timeline(){
  const { pubkey, relays, subscribeTimeline, getProfile, publishNote } = useContext(NostrContext)
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [profiles, setProfiles] = useState({}) // pubkey -> {name, picture}
  const [text, setText] = useState('')
  const seen = useRef(new Set())

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!pubkey) { router.replace('/'); return }
    if (!relays || relays.length === 0) return

    // 最新50件 + リアルタイム
    const sub = subscribeTimeline(
      [{ kinds:[1], limit: 50 }],
      {
        onEvent: async (evt) => {
          if (seen.current.has(evt.id)) return
          seen.current.add(evt.id)
          setEvents(prev => {
            const next = [evt, ...prev]
            return next.slice(0, 100)
          })
          // プロフィール解決
          if (!profiles[evt.pubkey]) {
            const p = await getProfile(evt.pubkey)
            setProfiles(prev => ({...prev, [evt.pubkey]: p}))
          }
        }
      }
    )
    return () => sub && sub.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkey, relays])

  if (!pubkey) return null

  const onSend = async () => {
    try{
      await publishNote(text)
      setText('')
    }catch(e){
      alert('送信失敗: ' + (e && e.message ? e.message : e))
    }
  }

  return (
    <div className="page">
      <h1>タイムライン</h1>

      {/* 投稿フォーム */}
      <div className="composer">
        <textarea
          value={text}
          onChange={e=>setText(e.target.value)}
          placeholder="いまどうしてる？"
          rows={3}
        />
        <button onClick={onSend} disabled={!text.trim()}>送信</button>
      </div>

      {/* TL */}
      <div className="list">
        {events.map(evt => {
          const p = profiles[evt.pubkey]
          const name = p?.name || `${evt.pubkey.slice(0,8)}…${evt.pubkey.slice(-4)}`
          const avatar = p?.picture || identiconSvg(evt.pubkey, 36)
          return (
            <div key={evt.id} className="item">
              <img className="avatar" src={avatar} alt="" />
              <div className="body">
                <div className="head">
                  <span className="name">{name}</span>
                  <span className="time">{new Date((evt.created_at||0)*1000).toLocaleString()}</span>
                </div>
                <div className="content">{evt.content}</div>
              </div>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .page{ padding:16px 16px 40px }
        .composer{ display:flex; gap:8px; align-items:flex-end; margin-bottom:12px }
        .composer textarea{ flex:1; border:1px solid #ddd; border-radius:8px; padding:8px; resize:vertical }
        .composer button{ padding:8px 12px }
        .list{ display:flex; flex-direction:column; gap:10px }
        .item{ display:flex; gap:10px; border-bottom:1px solid #f0f0f0; padding-bottom:10px }
        .avatar{ width:36px; height:36px; border-radius:9999px; object-fit:cover; flex:0 0 auto }
        .body{ flex:1; min-width:0 }
        .head{ display:flex; gap:8px; align-items:baseline; font-size:14px }
        .name{ font-weight:600 }
        .time{ color:#777; font-size:12px }
        .content{ white-space:pre-wrap; word-break:break-word; margin-top:4px }
      `}</style>
    </div>
  )
}
