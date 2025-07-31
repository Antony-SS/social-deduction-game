import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import {
  RoomUpdatePayload,
  QuestionPayload,
  AllAnswersPayload,
  VoteResultsPayload,
  GameOverPayload,
} from "../types";

import QuestionPhase from "../phases/QuestionPhase";
import VotingPhase from "../phases/VotingPhase";
import ResultsPhase from "../phases/ResultsPhase";

export default function Game({ roomId }: { roomId: string }) {
  const socket = useSocket();

  const [room, setRoom] = useState<RoomUpdatePayload | null>(null);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [answers, setAnswers] = useState<AllAnswersPayload | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResultsPayload | null>(null);
  const [gameOver, setGameOver] = useState<GameOverPayload | null>(null);

  // ---------------------------------- socket listeners
  useEffect(() => {
    socket.on("room_update", (data: RoomUpdatePayload) => setRoom(data));
    socket.on("question", (q: QuestionPayload) => {
      setQuestion(q);
      setAnswers(null);
      setVoteResults(null);
    });
    socket.on("all_answers", (a: AllAnswersPayload) => setAnswers(a));
    socket.on("vote_results", (vr: VoteResultsPayload) => setVoteResults(vr));
    socket.on("game_over", (go: GameOverPayload) => setGameOver(go));

    return () => {
      socket.off("room_update");
      socket.off("question");
      socket.off("all_answers");
      socket.off("vote_results");
      socket.off("game_over");
    };
  }, [socket]);

  // ---------------------------------- derived phase
  const phase = room?.phase;

  if (!room) return <p className="text-center mt-10">Joining room…</p>;
  if (gameOver)
    return (
      <div className="text-center mt-10">
        <h1 className="text-3xl mb-4">Game Over</h1>
        <p className="text-xl capitalize">Winners: {gameOver.winners}</p>
      </div>
    );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-center text-lg mb-4">Room {room.roomId} – Round {room.round}</h2>

      {phase === "question" && question && (
        <QuestionPhase question={question} alivePlayers={room.players.filter((p) => p.alive)} />
      )}

      {phase === "voting" && answers && (
        <VotingPhase answers={answers} roomId={room.roomId} />
      )}

      {phase === "results" && voteResults && (
        <ResultsPhase results={voteResults} room={room} />
      )}
    </div>
  );
}