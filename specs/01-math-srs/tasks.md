# 数学SRS系统 — 任务清单

## Phase 1: 项目搭建

- [ ] [T001] 初始化 Vite + React + TypeScript `math-srs/`
- [ ] [T002] 前端依赖：katex, lucide-react `package.json`
- [ ] [T003] 后端依赖：fastapi, uvicorn `requirements.txt`
- [ ] [T004] 配置 Tailwind CSS 暗色玻璃主题 `src/index.css`
- [ ] [T005] 初始化 Git + `.gitignore` (node_modules/ *.db dist/ __pycache__/)
- [ ] [T006] Scheme B 类型定义 `src/types/card.ts`

## Phase 2: 后端核心

- [ ] [T007] FastAPI 入口：0.0.0.0:3000 + CORS `server/main.py`
- [ ] [T008] Pydantic 模型 `server/models.py`
- [ ] [T009] SQLite WAL 初始化 + 建表 + seed `server/database.py`
- [ ] [T010] /api/cards CRUD `server/routers/cards.py`
- [ ] [T011] /api/srs/next (SM-2 筛选今日待复习) `server/routers/srs.py`
- [ ] [T012] /api/srs/review (评分 + SM-2 更新) `server/routers/srs.py`
- [ ] [T013] /api/import (JSON 导入) `server/routers/import_.py`
- [ ] [T014] /api/export (cards/progress/stats/backup) `server/routers/export.py`

## Phase 3: 前端 API 层

- [ ] [T015] fetch 封装：自动检测后端 + 回退 `src/api/client.ts`

## Phase 4: UI 组件

- [ ] [T016] 主布局（暗色玻璃 + Navbar）`src/components/Layout.tsx`
- [ ] [T017] 三级树形浏览（册→章→节）`src/components/BrowseMode.tsx`
- [ ] [T018] 预览模式：40s 倒计时 + 节信息 `src/components/PreviewMode.tsx`
- [ ] [T019] 倒计时条 `src/components/CountdownBar.tsx`
- [ ] [T020] Cloze 卡片（填空 + 逐空判定 + 绿/红反馈）`src/components/ClozeCard.tsx`
- [ ] [T021] Choice 卡片（四选一 + 绿/红 + 解析）`src/components/ChoiceCard.tsx`
- [ ] [T022] 评分结果面板 `src/components/ScoreResult.tsx`
- [ ] [T023] 导入/导出面板 `src/components/ImportExportPanel.tsx`

## Phase 5: 复习流程

- [ ] [T024] 复习主流程：调度 → 预览(40s) → 7维测试 → 结果 `src/components/ReviewMode.tsx`
- [ ] [T025] 安全限制：禁粘贴/复制/右键 `src/utils/security.ts`
- [ ] [T026] 二进制评分：cloze全对=3/choice对=3，其余=0
- [ ] [T027] 复习完成统计

## Phase 6: App 组装

- [ ] [T028] 主 App：浏览/复习/导入导出 三模式 `src/App.tsx`
- [ ] [T029] 入口 `src/main.tsx` + `index.html`
- [ ] [T030] Vite 配置 + 代理 `/api → :3000` `vite.config.ts`

## Phase 7: 内容植入

- [ ] [T031] 生成 70 张卡片 `public/data/cards.json`
- [ ] [T032] 几何图 → `public/images/`
- [ ] [T033] 首次 seed：启动时检查 cards 表空 → 从 cards.json 导入

## Phase 8: 局域网验证

- [ ] [T034] Mac 启动 FastAPI → iPad 访问 `http://<ip>:3000`
- [ ] [T035] iPad 复习 → Mac SQLite 进度同步验证
- [ ] [T036] 导入/导出功能验证（跨设备备份恢复）

## Phase 9: 打磨

- [ ] [T037] KaTeX 双重转义渲染验证
- [ ] [T038] SM-2 算法精度验证
- [ ] [T039] Git 仓库验证
- [ ] [T040] 40s 预览 → 跳转 → 安全限制流程验证
