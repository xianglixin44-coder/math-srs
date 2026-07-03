from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from server.database import init_db
from server.routers import cards, srs, import_export, browse, symbols, feynman, books


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
app.include_router(symbols.router)
app.include_router(feynman.router)
app.include_router(books.router)

# Serve static frontend (with SPA fallback via html=True)
static = Path("dist")
if static.exists():
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")


# SPA fallback: catch-all for non-API 404s → serve index.html
@app.exception_handler(404)
async def spa_fallback(request: Request, _exc):
    if not request.url.path.startswith("/api"):
        index = Path("dist") / "index.html"
        if index.exists():
            return FileResponse(index)
    from fastapi.responses import JSONResponse
    return JSONResponse({"detail": "Not Found"}, status_code=404)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
