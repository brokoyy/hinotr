// pages/relays.js
import React, { useState } from "react";
import { DEFAULT_RELAYS, setRelays, getRelays } from "../lib/nostr";

export default function Relays() {
  const [relays, updateRelays] = useState(getRelays());

  const handleChange = (index, value) => {
    const newRelays = [...relays];
    newRelays[index] = value;
    updateRelays(newRelays);
  };

  const handleSave = () => {
    setRelays(relays);
    alert("リレー設定を保存しました");
  };

  return (
    <div className="p-4">
      <button
        className="mb-4 bg-gray-200 p-2 rounded"
        onClick={() => (window.location.href = "/")}
      >
        トップに戻る
      </button>
      {relays.map((r, i) => (
        <div key={i} className="mb-2">
          <input
            type="text"
            value={r}
            onChange={e => handleChange(i, e.target.value)}
            className="border p-1 w-full"
          />
        </div>
      ))}
      <button
        onClick={handleSave}
        className="mt-2 bg-blue-500 text-white p-2 rounded"
      >
        保存
      </button>
    </div>
  );
}
