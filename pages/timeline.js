import { useEffect, useState } from "react";
import { fetchTimeline, postMessage } from "../lib/nostr";

export default function Timeline({ setView }) {
  const [timeline, setTimeline] = useState([]);
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    fetchTimeline((event) => {
      setTimeline(prev => [event, ...prev]);
    });
  }, []);

  const handlePost = async () => {
    if (!newPost) return;
    await postMessage(newPost);
    setNewPost("");
  };

  return (
    <div>
      <button style={{ position: "fixed", top: 10, left: 10 }} onClick={() => setView("top")}>
        トップに戻る
      </button>
      <div>
        <input
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          placeholder="投稿内容"
        />
        <button onClick={handlePost}>送信</button>
      </div>
      <div>
        {timeline.map((e, i) => (
          <div key={i}>
            <img src={`https://robohash.org/${e.pubkey}`} alt="icon" style={{ width: 40, height: 40 }} />
            <span>{e.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
