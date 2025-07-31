from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Literal
import itertools, random, string

Role = Literal["human", "bot", "joker"]


def gen_room_code(length: int = 6) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choice(alphabet) for _ in range(length))


def cycle_prompts():
    from .prompts import PROMPTS
    return itertools.cycle(PROMPTS)


@dataclass
class Player:
    sid: str
    name: str
    role: Role = "human"
    alive: bool = True
    vote: Optional[str] = None  # sid they voted for


@dataclass
class Room:
    code: str
    players: Dict[str, Player] = field(default_factory=dict)
    phase: str = "lobby"
    round: int = 0
    current_question: Optional[str] = None
    answers: Dict[str, str] = field(default_factory=dict)  # sid -> answer text
    end_votes: set[str] = field(default_factory=set)
    prompts_iter: itertools.cycle | None = None

    # Game helpers -----------------------------------------------------------
    async def broadcast_summary(self):
        from server.main import sio  # late import to avoid circular
        print(f"[broadcast_summary] {self.code=} {self.players=} {self.phase=} {self.round=}")
        await sio.emit(
            "room_update",
            {
                "roomId": self.code,
                "players": [p.__dict__ for p in self.players.values()],
                "phase": self.phase,
                "round": self.round,
            },
            room=self.code,
        )

    def next_prompt(self):
        if self.prompts_iter is None:
            self.prompts_iter = cycle_prompts()
        self.current_question = next(self.prompts_iter)