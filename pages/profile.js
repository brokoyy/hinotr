import React, { useContext, useEffect, useState } from 'react'
import { NostrContext, identiconSvg } from '../lib/nostr'
import { useRouter } from 'next/router'
import { subscribeMetadata } from '../lib/nostr'


export default function Profile(){
const { pubkey, relays } = useContext(NostrContext)
const router = useRouter()
const [meta, setMeta] = useState(null)


useEffect(()=>{
if (!pubkey) { if (typeof window !== 'undefined') router.push('/'); return }
let mounted = true
subscribeMetadata([pubkey], relays, (pk, parsed)=>{ if (mounted) setMeta(parsed) })
return ()=>{ mounted=false }
}, [pubkey, relays])


if (!pubkey) return null


return (
<div className="page center">
<h1>プロフィール</h1>
<img src={meta?.picture || identiconSvg(pubkey,120)} alt="avatar" style={{borderRadius:18,width:120,height:120,objectFit:'cover'}} />
<div className="name">{meta?.name || pubkey}</div>
{meta?.about && <div className="about">{meta.about}</div>}


<style jsx>{`
.page{ padding:24px }
.center{ display:flex; flex-direction:column; align-items:center }
.name{ margin-top:12px; font-weight:bold; word-break:break-all }
.about{ margin-top:8px; color:#444; text-align:center; max-width:320px }
`}</style>
</div>
)
}
