# 数学SRS系统 — 功能规格

## 概述

面向高中数学的间隔重复系统。Mac 运行 FastAPI + SQLite WAL 后端，iPad 通过局域网浏览器访问。SM-2 算法，Scheme B 卡片格式，按教材节粒度组织。

```
5 册 × ~14 节/册 ≈ 70 张卡片 × 7 维 = 490 次判定
```

## 架构

```
iPad ──HTTP──→ Mac:3000 (FastAPI + SQLite WAL)
               ↓
         cards.db (复习题库 + SRS 进度)
         public/data/browse/*.json (浏览卡片)
         public/data/browse/textbook.json (课本目录结构)
```

前端全设备通用（React 19 SPA + Vite + Tailwind CSS 4），后端仅运行在 Mac 上。

## 双数据源设计

| 数据源 | 用途 | 格式 | 存储 |
|--------|------|------|------|
| 浏览卡片 | 学习笔记、概念讲解 | sections JSON (Markdown) | `public/data/browse/*.json` |
| 复习卡片 | SRS 间隔重复测试 | Scheme B (cloze + choice) | SQLite cards 表 ← `cards.json` seed |

## 功能需求

### FR-1: 浏览模式

- 左侧课本目录：册 → 章 → 节三级折叠树（来自 `textbook.json`）
- 点击节 → 网格展示 7 个内容维度
- 点击维度 → 独立详情页全宽渲染 Markdown 笔记
- 详情页底部上一节/下一节导航按钮
- 字体 16px 正文可读性
- KaTeX 数学公式渲染

**7 个浏览维度：**

| key | 标签 | 内容 |
|-----|------|------|
| concept | 核心概念界定 | 定义、公理、符号 |
| method | 解题策略与方法论 | SOP 标准步骤 |
| pitfall | 易错点与风险规避 | 常见错误 + 辨析 |
| insight | 多维原理解码 | 代数/几何/逻辑视角 |
| example | 经典例题精讲 | 例题 + 完整解答 |
| connect | 知识关联网络 | 本章内/跨章关联 + 思维脉络图 |
| challenge | 101星思维挑战 | 拔高题 + 知识拓展 |

- Markdown 渲染支持：`##`/`###` 标题、表格、引用块 `>`、**粗体**、`$...$`/`$$...$$` KaTeX

### FR-2: 复习模式（SRS）

- 选题页：维度网格，点击进入复习
- 复习页：预览 40s 倒计时 → 自动进入测试
- 测试：cloze 填空 / choice 选择，提交即评分
- 评分后自动返回选题页
- 安全限制：禁粘贴/复制/右键
- 全部维度完成 → 下一张卡片按钮

### FR-3: 卡片数据模型（复习）

遵循 Scheme B 格式，一节 = 一张卡片：

```json
{
  "id": "01-02",
  "title": "集合间的基本关系",
  "category": "集合逻辑",
  "motifIds": ["M01"],
  "dimensions": {
    "cloze": {
      "formula": { "question": "... [[1]] ...", "answer": ["答案1"] },
      "derive":  { "question": "... [[1]] ...", "answer": ["..."] }
    },
    "choice": {
      "trigger":   { "question": "...", "options": [...], "answer": 2 },
      "geometry":  { "question": "...", "options": [...], "answer": 1 },
      "trap":      { "question": "...", "options": [...], "answer": 2 },
      "challenge": { "question": "...", "options": [...], "answer": 2 },
      "transform": { "question": "...", "options": [...], "answer": 1 }
    }
  }
}
```

| 规则 | 说明 |
|------|------|
| `[[N]]` 占位 | 不在 `$...$` 内，与 LaTeX 物理分离 |
| `answer` (cloze) | 字符串数组，`[0]` 对应 `[[1]]` |
| `answer` (choice) | 正确索引（0-3），前端 Fisher-Yates 乱序 |
| `options` | 4 选项，干扰项基于真实学生思维漏洞 |
| 维度弹性 | 缺维度不填，前端跳过 |

### FR-4: 评分与 SM-2 算法

| 题型 | 用户表现 | 评分 | SM-2 |
|------|----------|------|------|
| cloze | 全部填空正确 | 3 | 升级 |
| cloze | 任意空错误 | 0 | 重置 |
| choice | 一次选对 | 3 | 升级 |
| choice | 选错 | 0 | 重置 |

- 无 hint、无部分分
- cloze 匹配：忽略首尾空格和全角半角差异
- SM-2: ease_factor 下限 1.3，首次间隔 1d，第二次 6d

### FR-5: 数据持久化

```sql
cards (id TEXT PK, title TEXT, category TEXT, motif_ids TEXT, dimensions TEXT, source TEXT, enabled INTEGER)
srs_state (card_id TEXT PK, ease_factor REAL, interval INTEGER, due_date TEXT, reps INTEGER, last_review TEXT)
review_log (id INTEGER PK AUTOINCREMENT, card_id TEXT, dimension TEXT, score INTEGER, timestamp TEXT)
```

- `cards.json` → 首次启动 seed 到 cards 表（支持单对象 + 数组）
- `with_db()` context manager 保证连接异常安全
- lifespan 事件初始化数据库

### FR-6: 题库模式

- 右上角「题库」按钮 → 表格视图
- 顶部统计：总卡片数 / 待复习 / 已掌握
- 表格：ID / 标题 / 分类 / 复习次数 / 间隔 / 难度因子 / 到期日 / 状态标签

### FR-7: 导入与导出

| 导出 | 格式 | 说明 |
|------|------|------|
| 全部卡片 | JSON | cards.json 格式 |
| 复习进度 | JSON | srs_state + review_log |
| 复习统计 | CSV | 日期/卡片/维度/评分 |
| 备份包 | ZIP | cards + srs_state + review_log |

- 导入：粘贴 JSON → INSERT OR REPLACE

### FR-8: 数学渲染

- KaTeX 渲染 `$...$`（行内）和 `$$...$$`（块级）
- 浏览卡片 Markdown 中的公式自动渲染

### FR-9: UI

- 暗色玻璃蓝紫渐变（Tailwind CSS 4 + Lucide 图标）
- 左侧可折叠侧边栏（移动端默认隐藏）
- 响应式（桌面 + iPad）
- 离线检测：15s 间隔健康检查，离线黄色横幅

### FR-10: 输入验证

- score 0-3 Pydantic Field 校验
- dimension 白名单 `{formula, derive, trigger, geometry, trap, challenge, transform}`
- card 存在性检查
- import payload 必填字段校验

## 用户场景

1. Mac 启动 FastAPI → iPad 打开浏览器访问
2. 浏览：侧边栏选节 → 网格选维度 → 阅读笔记 → 上/下一节翻页
3. 复习：选题 → 预览 40s → 测试 → 评分 → 返回
4. 题库：查看全部卡片 SRS 状态
5. 导入/导出：粘贴 JSON 导入，一键下载导出

## 成功标准

- 2 张卡完成（01-01、01-02），每卡浏览 7 维 + 复习 7 维
- SM-2 二进制评分逻辑正确
- KaTeX 全部正确渲染
- 离线检测可用
- Git 仓库可追溯
