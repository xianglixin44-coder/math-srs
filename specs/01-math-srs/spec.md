# 数学SRS系统 — 功能规格

## 概述

面向高中数学的间隔重复系统。Mac 运行 Express + SQLite WAL 后端，iPad 通过局域网浏览器访问。SM-2 算法，Scheme B 卡片格式，按教材节粒度组织。

```
5 册 × ~14 节/册 ≈ 70 张卡片 × 7 维 = 490 次判定
```

## 架构

```
iPad ──HTTP──→ Mac:3000 (Express + SQLite WAL)
               ↓
         cards.db (题库 + 进度)
         cards.json (初始题库种子)
```

前端全设备通用（React SPA），后端仅运行在 Mac 上。

## 功能需求

### FR-1: 卡片数据模型

遵循 maths135-v2 **Scheme B** 格式，一节 = 一张卡片：

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
| `answer` (choice) | 正确索引（0-3），前端乱序渲染 |
| `options` | 4 选项，干扰项基于真实学生思维漏洞 |
| 维度弹性 | 缺维度不填，前端跳过 |

### FR-2: 评分与 SM-2 算法

```
┌────────┬──────────────┬──────┬──────────┐
│  题型  │    用户表现   │ 评分 │  SM-2    │
├────────┼──────────────┼──────┼──────────┤
│ cloze  │ 全部填空正确 │  3   │ 升级     │
│ cloze  │ 任意空错误   │  0   │ 重置     │
│ choice │ 一次选对     │  3   │ 升级     │
│ choice │ 选错         │  0   │ 重置     │
└────────┴──────────────┴──────┴──────────┘
```

- 无 hint、无部分分
- cloze 匹配：忽略首尾空格和全角半角差异，其余严格相等
- 7 维全部通过 = 该节掌握

### FR-3: 预览 + 测试

- **预览 40s**：节标题 + 核心公式/定义，隐藏选项和答案
- **倒计时** → 自动跳转测试（不可中断）
- **测试**：formula → derive → trigger → geometry → trap → challenge → transform 顺序
- **安全限制**：禁粘贴/复制/右键

### FR-4: 数据持久化 (SQLite WAL)

```sql
-- 题库
CREATE TABLE cards (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT,
  motif_ids   TEXT DEFAULT '[]',
  dimensions  TEXT NOT NULL,      -- JSON
  source      TEXT DEFAULT 'builtin',
  enabled     INTEGER DEFAULT 1
);

-- 复习进度
CREATE TABLE srs_state (
  card_id      TEXT PRIMARY KEY,
  ease_factor  REAL DEFAULT 2.5,
  interval     INTEGER DEFAULT 1,
  due_date     TEXT,
  reps         INTEGER DEFAULT 0,
  last_review  TEXT
);

-- 复习日志
CREATE TABLE review_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id    TEXT NOT NULL,
  dimension  TEXT NOT NULL,
  score      INTEGER NOT NULL,
  timestamp  TEXT DEFAULT (datetime('now'))
);
```

- cards.json → 首次启动 seed 到 cards 表
- 所有设备共享同一 SQLite（Mac 本地文件，Express 提供 API）

### FR-5: 导入与导出

#### 导入外接题库

| 方式 | 操作 |
|------|------|
| 文件 | 拖 `.json` → 解析 → INSERT INTO cards |
| 粘贴 | 粘贴 JSON → 解析 → INSERT |
| 管理 | 启用/禁用，同 id 覆盖内置 |

#### 导出数据

| 导出内容 | 格式 | 说明 |
|----------|------|------|
| 全部卡片 | `.json` | cards.json 格式，含内置 + 外接 |
| 复习进度 | `.json` | srs_state + review_log 完整数据 |
| 复习统计 | `.csv` | 日期/卡片/维度/评分，Excel 可读 |
| 备份包 | `.zip` | cards.json + srs_state + review_log 三合一 |

- 一键下载，浏览器触发
- 备份包可跨设备还原（另一台 Mac 导入恢复）

### FR-6: Git 版本控制

- `.gitignore`: `node_modules/`, `*.db`, `dist/`
- 追踪：`cards.json`, `src/`, `server/`, `specs/`
- `cards.db` 不提交（个人进度数据）

### FR-7: 局域网同步

- Express 监听 `0.0.0.0:3000`
- iPad 访问 `http://<mac-ip>:3000`
- 前端自动检测当前是否连接到后端（回退 file:// 只读模式）

### FR-8: 数学渲染

- KaTeX 渲染所有数学公式
- 图片本地加载

### FR-9: UI

- 暗色玻璃蓝紫渐变
- Tailwind CSS + Lucide 图标
- 响应式（桌面 + iPad）

## 用户场景

1. Mac 启动 Express → iPad 打开浏览器访问
2. 浏览：册→章→节 三级树形 → 查看卡片
3. 复习：SM-2 推送 → 预览 40s → 7 维测试 → 评分
4. 导入：拖 JSON → 即时合并
5. 关闭 Mac → iPad 不可用（数据在 Mac SQLite）

## 成功标准

- 70 张卡 × 7 维 = 490 判定，浏览模式完整可查
- SM-2 二进制评分逻辑正确
- iPad ↔ Mac 局域网共享复习进度（同一 SQLite）
- KaTeX 全部正确渲染
- 外接卡导入/合并无异常
- Git 仓库可追溯
