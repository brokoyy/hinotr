import React, { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { NostrContext } from '../lib/nostr'

export default function Logout(){
  const { logout } = useContext(NostrContext)
  const router = useRouter()

  useEffect(() => {
    logout()
    const t = setTimeout(() => { router.replace('/') }, 500)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line

  return (
    <div className="page">
      <p>ログアウトしています…</p>
      <style jsx>{`.page{ padding:24px }`}</style>
    </div>
  )
}
