import React, { useContext, useState } from 'react'
import { NostrContext } from '../lib/nostr'
import { useRouter } from 'next/router'


export default function Relays(){
const { pubkey, relays, setRelays } = useContext(NostrContext)
const [local, setLocal] = useState(relays.join('\n'))
const router = useRouter()


if (!pubkey) { if (typeof window !== 'undefined') router.push('/'); return null }


function save(){
const arr = local.split('\n').map(s=>s.trim()).filter(Boolean)
setRelays(arr)
alert('保存しました')
}


function addRelay(){ setLocal(local + '\n' + 'wss://') }


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
