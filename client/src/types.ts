export interface Player {
    sid: string;
    name: string;
    role: "human" | "bot" | "joker";
    alive: boolean;
}
  
export interface RoomUpdatePayload {
roomId: string;
players: Player[];
phase: "lobby" | "question" | "voting" | "results" | "gameover";
round: number;
}

export interface QuestionPayload { text: string; round: number }
export interface AllAnswersPayload { answers: { sid: string; text: string }[] }

export interface VoteResultsPayload {
tallies: Record<string, number>;
eliminated: string | null;
}

export interface GameOverPayload {
    winners: "humans" | "bot" | "joker";
}
