from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import init_db
from .routers import sessions, compat

STATIC_DIR = Path(__file__).parent.parent  # repo root


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Fighting Fantasy Console API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/api", tags=["sessions"])
app.include_router(compat.router, prefix="/api", tags=["compat"])

# StaticFiles mount must come last — it's a catch-all that would shadow API routes if registered first
app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
