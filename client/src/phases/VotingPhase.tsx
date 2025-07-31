import { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { AllAnswersPayload } from "../types";

export default function VotingPhase({ answers, roomId }: { answers: AllAnswersPayload; roomId: string }) {
  const socket = useSocket();
  const [selection, setSelection] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const vote = () => {
    if (!selection) return;
    socket.emit("vote", { roomId, targetSid: selection });
    setSubmitted(true);
  };

  return (
    <div>
      <h3 className="text-xl mb-2">Vote: Who is the bot?</h3>
      <ul className="space-y-2">
        {answers.answers.map((a) => (
          <li key={a.sid} className="border border-gray-600 p-2 rounded">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="vote"
                value={a.sid}
                disabled={submitted}
                onChange={() => setSelection(a.sid)}
              />
              <span>{a.text}</span>
            </label>
          </li>
        ))}
      </ul>
      {submitted ? (
        <p className="text-green-400 mt-4">Vote submitted! Waiting for results…</p>
      ) : (
        <button className="bg-purple-600 px-4 py-2 rounded mt-4" disabled={!selection} onClick={vote}>
          Submit Vote
        </button>
      )}
    </div>
  );
}