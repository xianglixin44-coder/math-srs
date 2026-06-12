from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from server.database import init_db
from server.routers import cards, srs, import_export, browse


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("✅ SQLite 初始化完成")
    print("✅ 服务启动: http://0.0.0.0:3000")
    yield


app = FastAPI(title="数学SRS系统", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cards.router)
app.include_router(srs.router)
app.include_router(import_export.router)
app.include_router(browse.router)

# Serve static frontend
static = Path("dist")
if static.exists():
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
