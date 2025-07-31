import uvicorn, asyncio
from fastapi import FastAPI
import socketio
from game.manager import GameManager

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = FastAPI()
sio_app = socketio.ASGIApp(sio, other_asgi_app=app)

gm = GameManager(sio)

# ───────────────────────── Socket.IO events ─────────────────────────
@sio.event
async def connect(sid, environ):
    print("[connect]", sid)

@sio.on("createRoom")
async def create_room(sid, data):
    name = data.get("name", "Anonymous")
    summary = await gm.create_room(sid, name)
    return summary  # Socket.IO ack

@sio.on("joinRoom")
async def join_room(sid, data):
    summary = await gm.join_room(data["roomId"], sid, data.get("name", "Anon"))
    return summary

@sio.event
async def disconnect(sid):
    await gm.disconnect(sid)
    print("[disconnect]", sid)

# ───────────────────────── FastAPI HTTP routes ──────────────────────
@app.get("/")
async def root():
    return {"status": "Running"}

# ───────────────────────── Dev entrypoint ───────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:sio_app", host="0.0.0.0", port=8080, reload=True)