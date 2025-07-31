import { useState } from "react";
import Lobby from "./pages/Lobby";
import Game  from "./pages/Game";
import { SocketProvider } from "./hooks/useSocket";

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

  return (
    <SocketProvider>
      {roomId ? (
        <Game roomId={roomId} />
      ) : (
        <Lobby onEnter={(id) => setRoomId(id)} />
      )}
    </SocketProvider>
  );
}
