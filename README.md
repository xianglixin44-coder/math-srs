# 数学SRS — 高中数学间隔重复系统

基于 SM-2 算法的局域网学习工具。Mac 运行后端，iPad/手机浏览器访问。

## 快速开始

```bash
# 安装依赖
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
npm install && npm run build

# 启动
env PYTHONPATH=. .venv/bin/uvicorn server.main:app --host 0.0.0.0 --port 3000
```

浏览器打开 `http://localhost:3000`

## 功能

- **浏览** — 7 维学习笔记（概念/方法/易错/原理/例题/关联/挑战）
- **复习** — SM-2 间隔重复，40s 预览 + 填空/选择测试
- **题库** — 全部卡片 SRS 状态表格
- **导入导出** — JSON/CSV/ZIP 多格式
- **手写草稿** — Canvas 画布，支持 Apple Pencil
- **iPad 适配** — 局域网访问，SPA fallback 防白屏

## 详细文档

→ [操作手册](MANUAL.md)

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| 后端 | FastAPI (Python) + SQLite WAL |
| 数学 | KaTeX |
| 图标 | Lucide React |
