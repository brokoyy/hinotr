import React, { useContext, useEffect, useState } from 'react'
import { NostrContext, DEFAULT_RELAYS } from '../lib/nostr'
import { useRouter } from 'next/router'

export default function Relays(){
  const { pubkey, relays, setRelays } = useContext(NostrContext)
  const [local, setLocal] = useState(DEFAULT_RELAYS.join('\n'))
  const router = useRouter()

  useEffect(() => {
    if (!pubkey) { router.replace('/'); return }
    setLocal((relays && relays.length ? relays : DEFAULT_RELAYS).join('\n'))
  }, [pubkey]) // eslint-disable-line

  function save(){
    const arr = local.split('\n').map(s=>s.trim()).filter(Boolean)
    setRelays(arr)
    alert('保存しました')
  }

  function addRelay(){ setLocal(prev => (prev ? prev + '\n' : '') + 'wss://') }

  if (!pubkey) return null

  return (
    <div className="page">
      <h1>リレー設定</h1>
      <p>各行に 1 つの WebSocket リレー URL を記述してください。</p>
      <textarea value={local} onChange={e=>setLocal(e.target.value)} rows={8} style={{width:'100%'}} />
      <div style={{marginTop:12}}>
        <button onClick={save}>保存</button>
        <button onClick={addRelay} style={{marginLeft:8}}>追加テンプレ</button>
      </div>

      <style jsx>{`.page{ padding:24px }`}</style>
    </div>
  )
}
