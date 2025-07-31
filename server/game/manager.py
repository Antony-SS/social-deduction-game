

from __future__ import annotations
import socketio, secrets
from .room import GameRoom

class GameManager:
    def __init__(self, sio: socketio.AsyncServer):
        self.sio = sio
        self.rooms: dict[str, GameRoom] = {}

    # create & join are socket event helpers
    async def create_room(self, sid: str, name: str):
        room_id = secrets.token_hex(3).upper()  # 6‑char code
        room = GameRoom(room_id, self.sio)
        self.rooms[room_id] = room
        self.sio.enter_room(sid, room_id)
        summary = room.add_player(sid, name)
        await room.broadcast()
        return summary

    async def join_room(self, room_id: str, sid: str, name: str):
        if room_id not in self.rooms:
            raise ValueError("Room not found")
        room = self.rooms[room_id]
        self.sio.enter_room(sid, room_id)
        summary = room.add_player(sid, name)
        await room.broadcast()
        return summary

    async def disconnect(self, sid: str):
        # remove player from whichever room they’re in
        for room in self.rooms.values():
            if any(p.id == sid for p in room.players):
                room.remove_player(sid)
                await room.broadcast()
                break