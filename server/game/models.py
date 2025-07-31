from dataclasses import dataclass, asdict
from typing import Literal, TypedDict, List

Role = Literal["human", "bot", "joker"]
Phase = Literal["lobby", "question", "voting", "results", "gameover"]

@dataclass
class Player:
    id: str
    name: str
    role: Role = "human"
    alive: bool = True

class GameSummary(TypedDict):
    roomId: str
    players: List[dict]
    phase: Phase