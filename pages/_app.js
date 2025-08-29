// pages/_app.js
import { NostrProvider } from "../lib/nostr";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }) {
  return (
    <NostrProvider>
      <Component {...pageProps} />
    </NostrProvider>
  );
}
