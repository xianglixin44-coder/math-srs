from pathlib import Path
from fastapi import APIRouter, UploadFile, HTTPException
from fastapi.responses import FileResponse

BOOKS_DIR = Path(__file__).parent.parent.parent / "data" / "books"
BOOKS_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("")
def list_books():
    """列出所有已上传的教材"""
    files = sorted(BOOKS_DIR.glob("*.pdf"), key=lambda f: f.stat().st_mtime, reverse=True)
    return [{"name": f.name, "size": f.stat().st_size} for f in files]


@router.post("/upload")
async def upload_book(file: UploadFile):
    """上传PDF教材"""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "仅支持 PDF 文件")
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:  # 100MB limit
        raise HTTPException(400, "文件大小不能超过 100MB")
    path = BOOKS_DIR / file.filename
    path.write_bytes(content)
    return {"ok": True, "name": file.filename, "size": len(content)}


@router.get("/{filename}")
def read_book(filename: str):
    """读取教材PDF"""
    path = BOOKS_DIR / filename
    if not path.exists():
        raise HTTPException(404, "教材不存在")
    return FileResponse(path, media_type="application/pdf")


@router.delete("/{filename}")
def delete_book(filename: str):
    """删除教材"""
    path = BOOKS_DIR / filename
    if not path.exists():
        raise HTTPException(404, "教材不存在")
    path.unlink()
    return {"ok": True}
