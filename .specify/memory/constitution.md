# 数学SRS系统 Constitution

## Core Principles

### I. SRS算法优先
- 核心为 SM-2 间隔重复算法，所有卡片调度依赖算法打分
- 卡片格式遵循 Scheme B 规范：7维 = cloze(formula+derive) + choice(trigger/geometry/transform/trap/challenge)
- LaTeX渲染使用 KaTeX，字段内使用双重转义 `\\\\frac`
- `[[N]]` 占位符严禁出现在 `$` 数学公式内部

### II. 离线可用 + 局域网同步 (NON-NEGOTIABLE)
- 所有资源本地化，零外部 CDN 依赖
- 前端 `file://` 回退可用
- Mac 运行 Express 后端，iPad 通过局域网访问
- SQLite WAL 为唯一数据源（Mac 本地文件）

### III. 数学内容完整性
- 锚点库包含 55 个核心数学锚点，每个带 matplotlib 几何解释图（≥200dpi）
- 卡片选项干扰项基于真实学生思维漏洞设计
- options 答案索引随机分布 0-3

### IV. UI体验
- 暗色玻璃蓝紫渐变风格（参照 smart-pdf-manager）
- Tailwind CSS + Lucide 图标
- 支持 📖浏览 / 📝复习 双模式切换

### V. 可测试性
- 每个功能模块独立可测
- SRS 算法精度可验证（复习间隔、难度因子计算）

## Technical Constraints

- 前端：Vite + React + TypeScript
- 后端（可选）：Express + SQLite WAL
- 图表：matplotlib 生成，透明背景，大字体，高清
- LaTeX：KaTeX CDN 或本地打包

## Development Workflow

- 功能优先独立模块实现
- 卡片数据与渲染逻辑分离
- 图片资源统一管理在 attachments/ 或 public/images/

## Governance

本宪法为项目最高准则，所有实现决策必须符合上述原则。修订需记录版本号和日期。

**Version**: 1.0.0 | **Ratified**: 2026-06-11 | **Last Amended**: 2026-06-11
