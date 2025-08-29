import '../styles/globals.css'
import { useState } from 'react'
import { NostrProvider } from '../lib/nostr'


export default function App({ Component, pageProps }) {
const [pubkey, setPubkey] = useState(null)
const [relays, setRelays] = useState([
'wss://relay.damus.io',
'wss://nostr-pub.wellorder.net'
])


return (
<NostrProvider value={{ pubkey, setPubkey, relays, setRelays }}>
<Component {...pageProps} />
</NostrProvider>
)
}
