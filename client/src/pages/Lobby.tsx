import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Player, RoomUpdatePayload } from "../types";

type Props = { onEnter: (roomId: string, room: RoomUpdatePayload) => void };

export default function Lobby({ onEnter }: Props) {
  const socket = useSocket();
  const [name, setName] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [room, setRoom] = useState<RoomUpdatePayload | null>(null);

  // ───────────────────────── live room updates
  useEffect(() => {
    socket.on("room_update", (data: RoomUpdatePayload) => setRoom(data));
    return () => socket.off("room_update");
  }, [socket]);

  // ───────────────────────── helpers
  const create = () =>
    socket.emit("create_room", { name }, (ack: { roomId: string; room: RoomUpdatePayload }) => {
      onEnter(ack.roomId, ack.room);                //   <— switch to Game screen
    });
  const join   = () =>
    socket.emit("join_room", { roomId: roomInput, name }, (ack: { roomId: string; room: RoomUpdatePayload }) => {
      onEnter(ack.roomId, ack.room);                //   <— switch to Game screen
    });
  const start  = () => socket.emit("start_game", { roomId: room!.roomId });

  const isHost = room && room.players[0]?.sid === socket.id;

  // ───────────────────────── UI
  if (room) {
    return (
      <div className="flex flex-col items-center gap-4 p-10">
        <h1 className="text-2xl">Room {room.roomId}</h1>

        <ul className="border border-gray-600 p-4 rounded w-64">
          {room.players.map((p: Player) => (
            <li key={p.sid} className={p.sid === socket.id ? "font-semibold" : ""}>
              {p.name || "Anon"} {p.sid === socket.id && "(you)"}
            </li>
          ))}
        </ul>

        {isHost ? (
          <button
            className="bg-purple-600 px-4 py-2 rounded"
            disabled={room.players.length < 3}   // e.g. min 3 players
            onClick={() => {
              start();
              onEnter(room.roomId);              // switch to Game screen
            }}
          >
            Start Game
          </button>
        ) : (
          <p className="text-sm text-gray-400">Waiting for host to start…</p>
        )}
      </div>
    );
  }

  // initial create / join form
  return (
    <div className="flex flex-col items-center gap-4 p-10">
      <input
        className="text-black p-2"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="flex gap-2">
        <button className="bg-blue-600 px-4 py-2 rounded" onClick={create}>
          Create Room
        </button>

        <input
          className="text-black p-2"
          placeholder="Room code"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
        />
        <button className="bg-green-600 px-4 py-2 rounded" onClick={join}>
          Join Room
        </button>
      </div>
    </div>
  );
}
