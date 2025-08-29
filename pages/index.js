import React, { useContext } from 'react'
import GridButton from '../components/GridButton'
import { NostrContext, nip07Login } from '../lib/nostr'
import { useRouter } from 'next/router'


export default function Home(){
const { pubkey, setPubkey } = useContext(NostrContext)
const router = useRouter()


async function handleLogin(){
try{
const pub = await nip07Login()
setPubkey(pub)
router.push('/profile')
}catch(err){ alert('Login failed: '+(err && err.message? err.message: err)) }
}


const disabledUnlessLoggedIn = !pubkey


return (
<div className="page center">
<h1 className="title">hinotr</h1>


<div className="grid">
<GridButton index={1} label={pubkey? 'プロフィール':'ログイン(1)'} subtitle={pubkey? pubkey.slice(0,8):'NIP-07 でログイン'} onClick={()=>{ if(!pubkey) handleLogin(); else router.push('/profile') }} disabled={false} />


<GridButton index={2} label={'リレー設定'} subtitle={'リレーを管理'} onClick={()=>router.push('/relays')} disabled={disabledUnlessLoggedIn} />


<GridButton index={3} label={'タイムライン'} subtitle={'投稿を見る'} onClick={()=>router.push('/timeline')} disabled={disabledUnlessLoggedIn} />


<GridButton index={4} label={'ログアウト'} subtitle={'セッションを終了'} onClick={()=>router.push('/logout')} disabled={disabledUnlessLoggedIn} />
</div>


<style jsx>{`
.page { padding:24px }
.center{ display:flex; flex-direction:column; align-items:center }
.title{ font-size:20px; margin-bottom:12px }
.grid{ width:100%; max-width:420px; display:grid; grid-template-columns:1fr 1fr; gap:12px }
`}</style>
</div>
)
}
