import uuid, asyncio, socketio
from .models import Player, GameSummary, Phase

class GameRoom:
    def __init__(self, room_id: str, sio: socketio.AsyncServer):
        self.id = room_id
        self.sio = sio
        self.players: list[Player] = []
        self.phase: Phase = "lobby"

    # ─────────────────────────────────────────────────────────
    # Public API called from GameManager
    # ─────────────────────────────────────────────────────────
    def add_player(self, sid: str, name: str, role: Player.role = "human") -> GameSummary:
        self.players.append(Player(id=sid, name=name, role=role))
        return self.summary()

    def remove_player(self, sid: str):
        self.players = [p for p in self.players if p.id != sid]

    def summary(self) -> GameSummary:
        return {
            "roomId": self.id,
            "players": [p.__dict__ for p in self.players],
            "phase": self.phase,
        }

    async def broadcast(self):
        await self.sio.emit("roomUpdate", self.summary(), room=self.id)
