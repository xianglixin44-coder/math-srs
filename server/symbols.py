"""
Detexify-style handwriting symbol recognition.
Ported from: https://github.com/kirel/detexify-hs-backend

Algorithm: stroke preprocessing → DTW distance → k-NN classification
"""
import json
import math
from pathlib import Path
from typing import Optional

# ─── Types ─────────────────────────────────────────────────────

Point = tuple[float, float]  # (x, y)
Stroke = list[Point]         # list of points
Strokes = list[Stroke]       # multi-stroke symbol

# ─── Vector operations ─────────────────────────────────────────

def _sub(a: Point, b: Point) -> Point:
    return (a[0] - b[0], a[1] - b[1])

def _add(a: Point, b: Point) -> Point:
    return (a[0] + b[0], a[1] + b[1])

def _scalar(s: float, p: Point) -> Point:
    return (s * p[0], s * p[1])

def _dot(a: Point, b: Point) -> float:
    return a[0] * b[0] + a[1] * b[1]

def _norm(p: Point) -> float:
    return math.sqrt(p[0] * p[0] + p[1] * p[1])

def _dist(a: Point, b: Point) -> float:
    return _norm(_sub(a, b))

# ─── Stroke preprocessing (Strokes.hs) ──────────────────────────

def unduplicate(stroke: Stroke, threshold: float = 1e-10) -> Stroke:
    """Remove successive duplicate points."""
    if len(stroke) < 2:
        return stroke[:]
    result = [stroke[0]]
    for p in stroke[1:]:
        if _dist(p, result[-1]) > threshold:
            result.append(p)
    return result

def smooth(stroke: Stroke) -> Stroke:
    """3-point moving average smoothing."""
    if len(stroke) < 3:
        return stroke[:]
    result = [stroke[0]]
    for i in range(1, len(stroke) - 1):
        x = (stroke[i-1][0] + stroke[i][0] + stroke[i+1][0]) / 3
        y = (stroke[i-1][1] + stroke[i][1] + stroke[i+1][1]) / 3
        result.append((x, y))
    result.append(stroke[-1])
    return result

def stroke_length(stroke: Stroke) -> float:
    """Total arc length of a stroke."""
    total = 0.0
    for i in range(1, len(stroke)):
        total += _dist(stroke[i-1], stroke[i])
    return total

def redistribute(stroke: Stroke, num_points: int = 32) -> Stroke:
    """Resample stroke to N equidistant points."""
    if len(stroke) < 2 or num_points <= 1:
        return stroke[:]
    if num_points == 1:
        return [stroke[0]]
    total_len = stroke_length(stroke)
    if total_len < 1e-10:
        return [stroke[0]] * num_points
    step = total_len / (num_points - 1)
    result = [stroke[0]]
    remaining = step
    i = 1
    while i < len(stroke) and len(result) < num_points:
        d = _dist(stroke[i-1], stroke[i])
        if d < remaining:
            remaining -= d
            i += 1
        else:
            t = remaining / d
            x = stroke[i-1][0] + t * (stroke[i][0] - stroke[i-1][0])
            y = stroke[i-1][1] + t * (stroke[i][1] - stroke[i-1][1])
            result.append((x, y))
            remaining = step
    # Pad if needed
    while len(result) < num_points:
        result.append(stroke[-1])
    return result[:num_points]

def bounding_box(stroke: Stroke) -> tuple[Point, Point]:
    """Return (min, max) bounding box of stroke."""
    xs = [p[0] for p in stroke]
    ys = [p[1] for p in stroke]
    return (min(xs), min(ys)), (max(xs), max(ys))

def refit(stroke: Stroke, target: tuple[float, float, float, float] = (0, 0, 1, 1)) -> Stroke:
    """Scale and translate stroke to fit target rectangle."""
    if len(stroke) < 1:
        return stroke[:]
    bb_min, bb_max = bounding_box(stroke)
    bb_w = bb_max[0] - bb_min[0]
    bb_h = bb_max[1] - bb_min[1]
    tw = target[2] - target[0]
    th = target[3] - target[1]
    sx = tw / bb_w if bb_w > 1e-10 else 1.0
    sy = th / bb_h if bb_h > 1e-10 else 1.0
    result = []
    for p in stroke:
        x = target[0] + (p[0] - bb_min[0]) * sx
        y = target[1] + (p[1] - bb_min[1]) * sy
        result.append((x, y))
    return result

def dominant(stroke: Stroke, angle_threshold: float = math.pi * 0.75) -> Stroke:
    """Remove points that are nearly collinear with neighbors."""
    if len(stroke) < 3:
        return stroke[:]
    result = [stroke[0]]
    i = 1
    while i < len(stroke) - 1:
        v = _sub(stroke[i], stroke[i-1])
        w = _sub(stroke[i+1], stroke[i])
        nv, nw = _norm(v), _norm(w)
        if nv < 1e-10 or nw < 1e-10:
            result.append(stroke[i])
            i += 1
            continue
        cos_angle = max(-1.0, min(1.0, _dot(v, w) / (nv * nw)))
        angle = math.acos(cos_angle)
        if angle > angle_threshold:
            result.append(stroke[i])
        i += 1
    result.append(stroke[-1])
    return result

def preprocess(stroke: Stroke) -> Stroke:
    """Full preprocessing pipeline."""
    s = unduplicate(stroke)
    if len(s) < 2:
        return s
    s = smooth(s)
    s = redistribute(s, 32)
    s = refit(s)
    s = dominant(s)
    return s

# ─── DTW (Dynamic Time Warping) ─────────────────────────────────

def dtw_distance(a: Stroke, b: Stroke) -> float:
    """Compute DTW distance between two strokes."""
    n, m = len(a), len(b)
    if n == 0 or m == 0:
        return float('inf')
    # DTW matrix
    dtw = [[float('inf')] * m for _ in range(n)]
    dtw[0][0] = _dist(a[0], b[0])
    for i in range(1, n):
        dtw[i][0] = dtw[i-1][0] + _dist(a[i], b[0])
    for j in range(1, m):
        dtw[0][j] = dtw[0][j-1] + _dist(a[0], b[j])
    for i in range(1, n):
        for j in range(1, m):
            cost = _dist(a[i], b[j])
            dtw[i][j] = cost + min(dtw[i-1][j], dtw[i][j-1], dtw[i-1][j-1])
    return dtw[n-1][m-1]

# ─── Symbol classifier ──────────────────────────────────────────

def stroke_distance(unknown: Strokes, sample: Strokes) -> float:
    """Distance between two multi-stroke symbols (sum of DTW distances)."""
    # Match strokes pairwise by index; pad shorter with empty strokes
    total = 0.0
    for i in range(max(len(unknown), len(sample))):
        u = unknown[i] if i < len(unknown) else []
        s = sample[i] if i < len(sample) else []
        if not u and not s:
            continue
        if not u or not s:
            total += 10.0  # penalty for stroke count mismatch
        else:
            total += dtw_distance(u, s)
    return total

# ─── Training data ─────────────────────────────────────────────

_training_data: Optional[dict[str, list[Strokes]]] = None  # {symbol: [samples]}
_flat_samples: Optional[list[tuple[str, Strokes]]] = None  # [(symbol, preprocessed_sample)]

def load_training(filepath: str = None):
    """Load training data from snapshot.json."""
    global _training_data, _flat_samples
    if filepath is None:
        filepath = Path(__file__).parent.parent.parent / "public" / "data" / "symbols.json"
    with open(filepath) as f:
        raw = json.load(f)
    _training_data = {}
    _flat_samples = []
    for symbol, samples in raw.items():
        processed = []
        for sample in samples:
            # sample is [stroke1, stroke2, ...] where each stroke is [[x,y],...]
            strokes = [[(p[0], p[1]) for p in s] for s in sample if s]
            if not strokes:
                continue
            # Preprocess each stroke
            preprocessed = [preprocess(s) for s in strokes]
            processed.append(preprocessed)
            _flat_samples.append((symbol, preprocessed))
        if processed:
            _training_data[symbol] = processed

def classify(strokes: Strokes, top_k: int = 5) -> list[tuple[str, float]]:
    """Classify handwritten strokes, returns [(symbol, confidence), ...]."""
    if _flat_samples is None:
        load_training()
    if not _flat_samples:
        return []
    # Preprocess input strokes
    preprocessed = [preprocess(s) for s in strokes if s]
    if not preprocessed:
        return []
    # Compute distances to all training samples
    results: dict[str, list[float]] = {}
    for symbol, sample in _flat_samples:
        d = stroke_distance(preprocessed, sample)
        if symbol not in results:
            results[symbol] = []
        results[symbol].append(d)
    # For each symbol, take mean of 2 closest samples
    scored = []
    for symbol, dists in results.items():
        dists.sort()
        mean2 = sum(dists[:2]) / min(2, len(dists))
        # Convert distance to confidence (0-1)
        confidence = 1.0 / (1.0 + mean2)
        scored.append((symbol, confidence))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]
