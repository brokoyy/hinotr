// pages/_app.js
import '../styles/globals.css'
import { NostrProvider } from '../lib/nostr'

export default function MyApp({ Component, pageProps }) {
  return (
    <NostrProvider>
      <Component {...pageProps} />
    </NostrProvider>
  )
}
