import { useEffect } from "react";
import { useSocket } from "../hooks/useSocket";

export default function Game({ roomId }: { roomId: string }) {
  const socket = useSocket();

  useEffect(() => {
    socket.on("roomUpdate", (data) => console.log("roomUpdate", data));
    socket.on("question", (q) => console.log("question", q));
    socket.on("voteResults", (r) => console.log("voteResults", r));
    socket.on("gameOver", (g) => console.log("gameOver", g));
    return () => {
      socket.off("roomUpdate");
      socket.off("question");
      socket.off("voteResults");
      socket.off("gameOver");
    };
  }, [socket]);

  return <h1 className="text-center mt-10 text-xl">Room {roomId}</h1>;
}