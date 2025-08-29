// pages/profile.js
import React, { useEffect, useState } from "react";

export default function Profile() {
  const [pubkey, setPubkey] = useState("");
  const [name, setName] = useState("No Name");
  const [picture, setPicture] = useState("");

  useEffect(() => {
    if (window.nostr) {
      window.nostr.getPublicKey().then(pk => setPubkey(pk));
      // プロフィール取得（簡易的にnip-05やkind0のキャッシュ無し）
      // 今はダミーで表示
      setName("ユーザー"); // 実際はKind0イベントから取得
      setPicture(""); // 実際はkind0からpicture取得
    }
  }, []);

  return (
    <div className="p-4">
      <button
        className="mb-4 bg-gray-200 p-2 rounded"
        onClick={() => (window.location.href = "/")}
      >
        トップに戻る
      </button>
      <div>
        {picture && <img src={picture} alt="icon" className="w-16 h-16 rounded-full" />}
        <p>名前: {name}</p>
        <p>pubkey: {pubkey}</p>
      </div>
    </div>
  );
}
