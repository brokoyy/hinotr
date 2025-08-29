import React, { useContext, useEffect, useState } from 'react'
import { NostrContext, identiconSvg } from '../lib/nostr'
import { useRouter } from 'next/router'

export default function Profile(){
  const { pubkey, getProfile } = useContext(NostrContext)
  const router = useRouter()
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!pubkey) { router.replace('/'); return }
    let live = true
    ;(async () => {
      const p = await getProfile(pubkey)
      if (!live) return
      setMeta(p)
    })()
    return () => { live = false }
  }, [pubkey])

  if (!pubkey) return null

  const displayName = meta?.name || `${pubkey.slice(0,8)}…${pubkey.slice(-4)}`

  return (
    <div className="page center">
      <h1>プロフィール</h1>
      <img
        src={meta?.picture || identiconSvg(pubkey, 80)}
        alt="avatar"
        className="avatar"
      />
      <div className="name">{displayName}</div>
      {meta?.about && <div className="about">{meta.about}</div>}

      <style jsx>{`
        .page{ padding:24px }
        .center{ display:flex; flex-direction:column; align-items:center }
        .avatar{ width:80px; height:80px; border-radius:9999px; object-fit:cover }
        .name{ margin-top:12px; font-weight:600; word-break:break-all }
        .about{ margin-top:8px; color:#444; text-align:center; max-width:320px; white-space:pre-wrap }
      `}</style>
    </div>
  )
}
