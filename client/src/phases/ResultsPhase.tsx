import { useSocket } from "../hooks/useSocket";
import { VoteResultsPayload, RoomUpdatePayload } from "../types";
import { useState } from "react";

export default function ResultsPhase({ results, room }: { results: VoteResultsPayload; room: RoomUpdatePayload }) {
  const socket = useSocket();
  const [endYes, setEndYes] = useState(false);

  const toggleEnd = () => {
    const yes = !endYes;
    setEndYes(yes);
    socket.emit("end_proposal", { roomId: room.roomId, yes });
  };

  return (
    <div>
      <h3 className="text-xl mb-2">Results</h3>
      <ul className="space-y-1 text-sm">
        {Object.entries(results.tallies).map(([sid, count]) => (
          <li key={sid} className={sid === results.eliminated ? "text-red-400" : ""}>
            {sid.substring(0, 5)}… : {count} votes
          </li>
        ))}
      </ul>
      {results.eliminated ? <p className="mt-2">Eliminated: {results.eliminated.substring(0, 5)}…</p> : <p>No one eliminated</p>}
      <button className="bg-yellow-600 px-4 py-2 rounded mt-4" onClick={toggleEnd}>
        {endYes ? "Retract End‑Game Vote" : "Vote to End Game"}
      </button>
    </div>
  );
}