// pages/index.js
import React, { useState, useEffect } from "react";
import GridButton from "../components/GridButton";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!window.nostr?.getPublicKey);
  }, []);

  const handleLogin = async () => {
    if (window.nostr) {
      try {
        await window.nostr.requestSignEvent({ content: "login" });
        setIsLoggedIn(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      alert("NIP-07がありません");
    }
  };

  return (
    <div className="p-4">
      {!isLoggedIn ? (
        <GridButton onClick={handleLogin}>ログイン</GridButton>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <GridButton onClick={() => (window.location.href = "/profile")}>
            1 プロフィール
          </GridButton>
          <GridButton onClick={() => (window.location.href = "/relays")}>
            2 リレー設定
          </GridButton>
          <GridButton onClick={() => (window.location.href = "/timeline")}>
            3 タイムライン
          </GridButton>
          <GridButton onClick={() => (window.location.href = "/logout")}>
            4 ログアウト
          </GridButton>
        </div>
      )}
    </div>
  );
}
