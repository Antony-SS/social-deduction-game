import { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { QuestionPayload, Player } from "../types";

export default function QuestionPhase({ question, alivePlayers }: { question: QuestionPayload; alivePlayers: Player[] }) {
  const socket = useSocket();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    socket.emit("submit_answer", { roomId: question.round /* misuse roomId not needed */, text });
    setSubmitted(true);
  };

  return (
    <div>
      <h3 className="text-xl mb-2">Question:</h3>
      <p className="mb-4 italic">{question.text}</p>
      {submitted ? (
        <p className="text-green-400">Answer submitted! Waiting for others…</p>
      ) : (
        <>
          <textarea className="w-full h-24 text-black p-2" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="bg-blue-600 px-4 py-2 rounded mt-2" disabled={!text.trim()} onClick={submit}>
            Submit
          </button>
        </>
      )}
      <p className="mt-4 text-sm text-gray-400">Alive players: {alivePlayers.length}</p>
    </div>
  );
}