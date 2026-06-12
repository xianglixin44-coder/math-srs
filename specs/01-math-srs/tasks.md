# 数学SRS系统 — 任务清单

## Phase 1: 项目搭建 ✅

- [x] [T001] 初始化 Vite + React + TypeScript
- [x] [T002] 前端依赖：katex, lucide-react, tailwindcss
- [x] [T003] 后端依赖：fastapi, uvicorn
- [x] [T004] Tailwind CSS 暗色玻璃主题
- [x] [T005] Git + `.gitignore` (node_modules/ *.db dist/ .venv/ __pycache__/ .reasonix/)
- [x] [T006] Scheme B 类型定义

## Phase 2: 后端核心 ✅

- [x] [T007] FastAPI 入口：lifespan + CORS + static mount
- [x] [T008] Pydantic 模型 + Field 校验
- [x] [T009] SQLite WAL + 建表 + seed（支持 dict/array）
- [x] [T010] /api/cards CRUD
- [x] [T011] /api/srs/next（SM-2 筛选）
- [x] [T012] /api/srs/review（评分 + SM-2 + review_log + 维度通过判定）
- [x] [T013] /api/import（JSON 导入 + 校验）
- [x] [T014] /api/export（cards/progress/stats/backup）
- [x] [T015] /api/browse/cards + /api/browse/cards/:id（浏览卡片 API）
- [x] [T016] `with_db()` context manager 异常安全连接

## Phase 3: 前端 API 层 ✅

- [x] [T017] fetch 封装 + 健康检查

## Phase 4: UI 组件 ✅

- [x] [T018] Layout：顶部导航 + 侧边栏折叠
- [x] [T019] Sidebar：课本三级目录（册→章→节），未制作卡片灰显
- [x] [T020] BrowseMode：7维网格 + 点击跳转详情页 + Markdown 渲染
- [x] [T021] PreviewMode：40s 倒计时 + 进度条
- [x] [T022] ClozeCard：填空 + 全角半角归一化 + 绿/红反馈
- [x] [T023] ChoiceCard：四选一 + Fisher-Yates 乱序 + 绿/红反馈
- [x] [T024] ReviewMode：选题→预览→测试→评分→返回 流程
- [x] [T025] BankMode：题库表格 + 统计卡片
- [x] [T026] ImportExportPanel：粘贴导入 + 四格式导出

## Phase 5: 复习流程 ✅

- [x] [T027] 复习主流程：选题网格 → 预览 40s → 测试 → 评分 → 返回
- [x] [T028] 安全限制：禁粘贴/复制/右键
- [x] [T029] 二进制评分：cloze全对=3/choice对=3，其余=0
- [x] [T030] ViewState 联合类型状态管理

## Phase 6: 浏览内容 ✅

- [x] [T031] 浏览卡片 JSON 格式：sections 数组（key/label/content）
- [x] [T032] textbook.json 三级目录结构
- [x] [T033] Markdown 渲染器：##/###/表格/引用/**粗体**/KaTeX
- [x] [T034] 01-01 集合的概念：7 section 浏览 + 7维 复习
- [x] [T035] 01-02 集合间的基本关系：7 section 浏览 + 7维 复习
- [x] [T036] 上一节/下一节导航按钮

## Phase 7: 打磨 ✅

- [x] [T037] KaTeX 双重转义渲染
- [x] [T038] 离线检测：15s 间隔健康检查 + 黄色横幅
- [x] [T039] 字体放大：正文 16px，标题 18px
- [x] [T040] SM-2 算法精度验证
- [x] [T041] 输入校验：score range + dimension 白名单 + card 存在性
- [x] [T042] `__init__.py` 包初始化

## Phase 8: 待完成

- [ ] [T043] 生成完整 70 张卡片
- [ ] [T044] 01-03 集合的基本运算（浏览 + 复习）
- [ ] [T045] 第一册全章节内容
- [ ] [T046] 局域网 iPad 验证
- [ ] [T047] 移动端响应式优化
