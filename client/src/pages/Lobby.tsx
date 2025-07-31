import { useState } from "react";
import { useSocket } from "../hooks/useSocket";

export default function Lobby({ onEnter }: { onEnter: (roomId: string) => void }) {
  const socket = useSocket();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  const create = () => {
    socket.emit("createRoom", { name }, (summary: { roomId: string }) => {
      onEnter(summary.roomId);
    });
  };

  const join = () => {
    socket.emit("joinRoom", { roomId: room, name }, (summary: { roomId: string }) => {
      onEnter(summary.roomId);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-10">
      <input className="text-black p-2" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="flex gap-2">
        <button className="bg-blue-600 px-4 py-2 rounded" onClick={create}>Create Room</button>
        <input className="text-black p-2" placeholder="Room code" value={room} onChange={(e) => setRoom(e.target.value)} />
        <button className="bg-green-600 px-4 py-2 rounded" onClick={join}>Join Room</button>
      </div>
    </div>
  );
}