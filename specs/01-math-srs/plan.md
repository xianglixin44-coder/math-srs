# 数学SRS系统 — 实现计划

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Vite 8 + React 19 + TypeScript 6 | SPA |
| 后端 | FastAPI (Python) + uvicorn | REST API |
| 数据库 | sqlite3 (标准库) | SQLite WAL |
| 样式 | Tailwind CSS 4 | 暗色玻璃蓝紫渐变 |
| 图标 | Lucide React | 本地打包 |
| 数学 | KaTeX | 本地打包 |

## 架构

```
src/                  ← React SPA (Vite build → dist/)
├── main.tsx
├── App.tsx            ← 四模式路由：浏览/复习/题库/导入导出
├── index.css
├── types/card.ts      ← Scheme B 类型定义
├── api/client.ts      ← fetch 封装 + 健康检查
├── components/
│   ├── Layout.tsx     ← 顶部导航 + 侧边栏折叠
│   ├── Sidebar.tsx    ← 课本三级目录树
│   ├── BrowseMode.tsx ← 7维网格 + Markdown详情页
│   ├── ReviewMode.tsx ← 选题→预览→测试→评分流程
│   ├── PreviewMode.tsx← 40s倒计时预览
│   ├── ClozeCard.tsx  ← 填空测试卡片
│   ├── ChoiceCard.tsx ← 选择测试卡片（含乱序）
│   ├── BankMode.tsx   ← 题库管理表格
│   └── ImportExportPanel.tsx
└── utils/katex.tsx    ← KaTeX 渲染 + 混合文本

server/               ← FastAPI (Python)
├── main.py            ← lifespan + CORS + static mount
├── database.py         ← SQLite init + seed + SM-2 + with_db() CM
├── models.py           ← Pydantic 模型 + Field 校验
└── routers/
    ├── cards.py        ← /api/cards
    ├── srs.py          ← /api/srs
    ├── browse.py       ← /api/browse/cards
    └── import_export.py← /api/import + /api/export/*

public/data/
├── cards.json          ← 复习题库种子（数组格式）
└── browse/
    ├── textbook.json   ← 课本目录树结构
    ├── 01-01.json      ← 浏览卡片
    └── 01-02.json      ← 浏览卡片
```

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/cards` | 全部复习卡片 |
| GET | `/api/cards/:id` | 单张复习卡片 |
| GET | `/api/srs/state` | 全部复习状态 |
| GET | `/api/srs/next` | 今日待复习卡片 |
| POST | `/api/srs/review` | 提交评分 `{card_id, dimension, score}` |
| GET | `/api/browse/cards` | 浏览卡片列表（摘要） |
| GET | `/api/browse/cards/:id` | 浏览卡片完整内容 |
| POST | `/api/import` | 导入 JSON |
| GET | `/api/export/cards` | 导出卡片 JSON |
| GET | `/api/export/progress` | 导出进度 JSON |
| GET | `/api/export/stats` | 导出统计 CSV |
| GET | `/api/export/backup` | 导出备份 ZIP |

## 数据模型

```sql
cards (id TEXT PK, title TEXT, category TEXT, motif_ids TEXT, dimensions TEXT, source TEXT, enabled INTEGER)
srs_state (card_id TEXT PK, ease_factor REAL, interval INTEGER, due_date TEXT, reps INTEGER, last_review TEXT)
review_log (id INTEGER PK AUTOINCREMENT, card_id TEXT, dimension TEXT, score INTEGER, timestamp TEXT)
```

## 启动

```bash
# 后端
.venv/bin/pip install -r requirements.txt
env PYTHONPATH=. .venv/bin/uvicorn server.main:app --host 0.0.0.0 --port 3000

# 前端（开发）
npm run dev

# 前端（生产构建，由后端静态服务）
npm run build
```
