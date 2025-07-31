from fastapi import FastAPI
import socketio, asyncio
from typing import Dict
from .game.models import Room, Player, gen_room_code
from .game import models  # ensure prompts imported

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = FastAPI()
sio_app = socketio.ASGIApp(sio, app)

rooms: Dict[str, Room] = {}

# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def get_room(code: str) -> Room:
    if code not in rooms:
        raise ValueError("Room not found")
    return rooms[code]

async def start_question_phase(room: Room):
    room.phase = "question"
    room.round += 1
    room.next_prompt()
    room.answers.clear()
    room.end_votes.clear()
    room.broadcast_summary()

    # Broadcast prompt
    await sio.emit("question", {"text": room.current_question, "round": room.round}, room=room.code)

    # Start 60‑sec timer
    asyncio.create_task(question_timeout(room))

async def question_timeout(room: Room, timeout: int = 60):
    await asyncio.sleep(timeout)
    if room.phase == "question":
        await goto_voting(room)

async def goto_voting(room: Room):
    room.phase = "voting"
    room.broadcast_summary()

    # Shuffle answers uniformly
    answer_list = list(room.answers.items())
    import random
    random.shuffle(answer_list)
    await sio.emit("all_answers", {"answers": [{"sid": sid, "text": txt} for sid, txt in answer_list]}, room=room.code)

    asyncio.create_task(voting_timeout(room))

async def voting_timeout(room: Room, timeout: int = 30):
    await asyncio.sleep(timeout)
    if room.phase == "voting":
        await tally_votes(room)

async def tally_votes(room: Room):
    room.phase = "results"
    # Count votes
    tallies: Dict[str, int] = {}
    for p in room.players.values():
        if p.vote:
            tallies[p.vote] = tallies.get(p.vote, 0) + 1
    # Determine elimination
    eliminated_sid = max(tallies.items(), key=lambda kv: kv[1])[0] if tallies else None
    if eliminated_sid:
        room.players[eliminated_sid].alive = False
    await sio.emit("vote_results", {"tallies": tallies, "eliminated": eliminated_sid}, room=room.code)
    room.broadcast_summary()

    # 10‑sec reveal before end‑check
    await asyncio.sleep(10)
    await end_check(room)

async def end_check(room: Room):
    alive_humans = [p for p in room.players.values() if p.alive and p.role == "human"]
    alive_bot = next((p for p in room.players.values() if p.alive and p.role == "bot"), None)
    # If majority of alive players voted to end, finish game
    if len(room.end_votes) > len([p for p in room.players.values() if p.alive]) / 2:
        winners: str
        if alive_bot:
            winners = "bot"
        elif any(p.role == "joker" and not p.alive for p in room.players.values()):
            winners = "joker"
        else:
            winners = "humans"
        room.phase = "gameover"
        await sio.emit("game_over", {"winners": winners}, room=room.code)
    else:
        await start_question_phase(room)

# ---------------------------------------------------------------------------
# Socket events
# ---------------------------------------------------------------------------
@sio.event
async def connect(sid, environ):
    print("[connect]", sid)

@sio.event
async def disconnect(sid):
    print("[disconnect]", sid)
    # remove player from any room
    for room in rooms.values():
        if sid in room.players:
            del room.players[sid]
            await room.broadcast_summary()
            break

@sio.event
async def create_room(sid, data):
    name = data.get("name", "Anon")
    code = gen_room_code()
    room = Room(code=code)
    rooms[code] = room
    # First player always human
    room.players[sid] = Player(sid=sid, name=name, role="human")
    await sio.enter_room(sid, code)
    print(f"[create_room] {sid=} {code=} players={list(room.players.keys())}")
    await room.broadcast_summary()
    return {
    "roomId": code,
    "room": {
        "roomId": code,
        "hostSid": room.host_sid,
        "players": [p.__dict__ for p in room.players.values()],
        "phase": room.phase,
        "round": room.round,
        },
    }
@sio.event
async def join_room(sid, data):
    code = data["roomId"]
    name = data.get("name", "Anon")
    room = get_room(code)
    room.players[sid] = Player(sid=sid, name=name)
    await sio.enter_room(sid, code)
    print(f"[join_room]  {sid=} {code=} players={list(room.players.keys())}")
    await room.broadcast_summary()
    return {
    "roomId": code,
    "room": {
        "roomId": code,
        "hostSid": room.host_sid,
        "players": [p.__dict__ for p in room.players.values()],
        "phase": room.phase,
        "round": room.round,
    },
}
@sio.event
async def start_game(sid, data):
    code = data["roomId"]
    room = get_room(code)

    # Randomly assign bot & optional joker
    import random
    sids = list(room.players.keys())
    bot_sid = random.choice(sids)
    room.players[bot_sid].role = "bot"
    if len(sids) >= 4:
        joker_sid = random.choice([s for s in sids if s != bot_sid])
        room.players[joker_sid].role = "joker"

    await start_question_phase(room)

@sio.event
async def submit_answer(sid, data):
    code = data["roomId"]
    answer = data["text"]
    room = get_room(code)
    if room.phase != "question" or sid in room.answers:
        return
    room.answers[sid] = answer

    # If all alive players answered, proceed early
    if len(room.answers) == len([p for p in room.players.values() if p.alive]):
        await goto_voting(room)

@sio.event
async def vote(sid, data):
    code = data["roomId"]
    target_sid = data["targetSid"]
    room = get_room(code)
    if room.phase != "voting":
        return
    room.players[sid].vote = target_sid

    if all(p.vote for p in room.players.values() if p.alive):
        await tally_votes(room)

@sio.event
async def end_proposal(sid, data):
    code = data["roomId"]
    yes = data["yes"]
    room = get_room(code)
    if yes:
        room.end_votes.add(sid)
    else:
        room.end_votes.discard(sid)

# ============================================================================
# END OF v0.2 – Socket events fully wired to the FSM; client unchanged.
# ============================================================================
