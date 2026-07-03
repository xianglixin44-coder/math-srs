import json
from pathlib import Path
import asyncio
from fastapi import APIRouter, Request
from server.symbols import classify, load_training, Strokes

router = APIRouter(prefix="/api/symbols", tags=["symbols"])

# Load training data on startup
TRAINING_FILE = Path(__file__).resolve().parent.parent / "public" / "data" / "symbols.json"
if TRAINING_FILE.exists():
    load_training(str(TRAINING_FILE))


@router.post("/recognize")
async def recognize_symbol(req: Request):
    """
    Recognize a hand-drawn symbol from strokes.
    Body: { "strokes": [[[x1,y1],[x2,y2],...], [[x1,y1],...]] }
    Returns: [{ "symbol": "∈", "confidence": 0.85 }, ...]
    """
    body = await req.json()
    raw_strokes: Strokes = [[(p[0], p[1]) for p in s] for s in body.get("strokes", [])]
    if not raw_strokes:
        return []
    results = await asyncio.to_thread(classify, raw_strokes, 5)
    return [{"symbol": sym, "confidence": round(conf, 3)} for sym, conf in results]


@router.post("/train")
async def train_symbol(req: Request):
    """
    Add a training sample.
    Body: { "symbol": "∈", "strokes": [[[x1,y1],...]] }
    """
    body = await req.json()
    symbol = body["symbol"]
    strokes = body["strokes"]
    if TRAINING_FILE.exists():
        data = json.loads(TRAINING_FILE.read_text())
    else:
        data = {}
    if symbol not in data:
        data[symbol] = []
    data[symbol].append(strokes)
    TRAINING_FILE.write_text(json.dumps(data, ensure_ascii=False))
    load_training(str(TRAINING_FILE))
    return {"trained": symbol, "total_samples": len(data[symbol])}
