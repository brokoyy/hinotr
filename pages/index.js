import { useState } from "react";
import Profile from "./profile";
import Timeline from "./timeline";

export default function Home() {
  const [view, setView] = useState("top");

  return (
    <div>
      {view === "top" && (
        <div>
          <h1>トップ</h1>
          <button onClick={() => setView("profile")}>プロフィール</button>
          <button onClick={() => setView("timeline")}>タイムライン</button>
        </div>
      )}
      {view === "profile" && <Profile setView={setView} />}
      {view === "timeline" && <Timeline setView={setView} />}
    </div>
  );
}
