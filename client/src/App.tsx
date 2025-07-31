import { useState } from "react";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import { SocketProvider } from "./pages/hooks/useSocket";

export default function App() {
  const [phase, setPhase] = useState<"lobby" | "game">("lobby");
  const [roomId, setRoomId] = useState<string | null>(null);

  return (
    <SocketProvider>
      {phase === "lobby" && <Lobby onEnter={(id) => { setRoomId(id); setPhase("game"); }} />}
      {phase === "game" && roomId && <Game roomId={roomId} />}
    </SocketProvider>
  );
}