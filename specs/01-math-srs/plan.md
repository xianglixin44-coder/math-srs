# 数学SRS系统 — 实现计划

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Vite 6 + React 19 + TypeScript | SPA |
| 后端 | FastAPI (Python) | REST API |
| 数据库 | sqlite3 (标准库) | SQLite WAL |
| 样式 | Tailwind CSS 4 | 暗色玻璃 |
| 图标 | Lucide React | 本地打包 |
| 数学 | KaTeX | 本地打包 |
| 版本控制 | Git | 不提交 *.db |

## 架构

```
src/          ← React SPA (Vite build → dist/)
server/       ← FastAPI (Python)
  ├── main.py              # FastAPI 入口, 0.0.0.0:3000, CORS
  ├── database.py           # SQLite 初始化 + 建表 + seed
  ├── models.py             # Pydantic 模型
  └── routers/
      │       ├── cards.py          # /api/cards CRUD
      │       ├── srs.py            # /api/srs/next, /api/srs/review
      │       ├── import_.py        # /api/import
      │       └── export.py         # /api/export/*
public/data/
  └── cards.json            # 题库种子（首次启动 seed 到 SQLite）
```

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/cards` | 全部卡片 |
| GET | `/api/cards/:id` | 单张卡片 |
| POST | `/api/cards` | 新增卡片 |
| PUT | `/api/cards/:id` | 更新/禁用 |
| GET | `/api/srs/state` | 全部复习状态 |
| GET | `/api/srs/next` | 今日待复习卡片列表 |
| POST | `/api/srs/review` | 提交评分 `{cardId, dimension, score}` |
| POST | `/api/import` | 导入 JSON（文件/粘贴） |
| GET  | `/api/export/cards` | 导出全部卡片 JSON |
| GET  | `/api/export/progress` | 导出复习进度 JSON |
| GET  | `/api/export/stats` | 导出统计 CSV |
| GET  | `/api/export/backup` | 导出完整备份 ZIP |

## 数据模型

```sql
cards (id TEXT PK, title TEXT, category TEXT, motif_ids TEXT, dimensions TEXT, source TEXT, enabled INTEGER)
srs_state (card_id TEXT PK, ease_factor REAL, interval INTEGER, due_date TEXT, reps INTEGER, last_review TEXT)
review_log (id INTEGER PK AUTOINCREMENT, card_id TEXT, dimension TEXT, score INTEGER, timestamp TEXT)
```

GPT: sqlite3 标准库 + WAL 模式。

## 项目结构

```
math-srs/
├── index.html
├── package.json
├── requirements.txt         # fastapi, uvicorn
├── vite.config.ts
├── .gitignore               # node_modules/ *.db dist/ __pycache__/
├── public/
│   ├── data/cards.json      # 题库种子 (~70 张)
│   └── images/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/card.ts
│   ├── api/client.ts         # fetch 封装
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── BrowseMode.tsx
│   │   ├── ReviewMode.tsx
│   │   ├── PreviewMode.tsx
│   │   ├── CountdownBar.tsx
│   │   ├── ClozeCard.tsx
│   │   ├── ChoiceCard.tsx
│   │   ├── ScoreResult.tsx
│   │   └── ImportPanel.tsx
│   └── utils/
│       ├── katex.ts
│       └── security.ts
├── server/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   └── routers/
│       ├── cards.py
│       ├── srs.py
│       └── import_.py
└── specs/01-math-srs/
    ├── spec.md
    ├── plan.md
    └── tasks.md
```

## 启动

```bash
# 后端
pip install -r requirements.txt
python server/main.py          # FastAPI :3000

# 前端
npm run dev                    # Vite :5173 → proxy :3000
```
