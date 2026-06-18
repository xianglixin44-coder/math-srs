import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const WORKSPACE = process.env.WORKSPACE || "/tmp";
const TMP_DIR = `${WORKSPACE}/tmp`;
const PREVIEW_DIR = `${TMP_DIR}/preview`;
const LAYOUT_DIR = `${TMP_DIR}/layout`;
const FINAL_PPTX = process.env.FINAL_PPTX || `${WORKSPACE}/math-srs-presentation.pptx`;

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

async function writeText(path, text) {
  await fs.writeFile(path, text);
}

const C = {
  bg: "#0a0e1a",
  card: "rgba(15,23,42,0.85)",
  border: "rgba(148,163,184,0.15)",
  accent: "#a855f7",
  accent2: "#60a5fa",
  accent3: "#22d3ee",
  text: "#e2e8f0",
  dim: "#64748b",
  bright: "#f8fafc",
  green: "#4ade80",
  amber: "#fbbf24",
  rose: "#fb7185",
};

const GRAD = "linear(135deg, #1a0533 0%, #0a1628 50%, #0a0e1a 100%)";

async function main() {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(LAYOUT_DIR, { recursive: true });

  const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });

  // Helper: add a textbox
  function addText(slide, left, top, width, height, text, style = {}) {
    const tb = slide.shapes.add({
      geometry: "textbox",
      position: { left, top, width, height },
      fill: "none",
      line: { style: "solid", fill: "none", width: 0 },
    });
    tb.text = text;
    tb.text.style = { fontSize: 14, color: C.text, ...style };
    return tb;
  }

  // Helper: section header
  function addSection(slide, label) {
    addText(slide, 72, 48, 300, 24, label, { fontSize: 12, bold: true, color: C.accent });
  }

  // Helper: page title
  function addTitle(slide, text) {
    addText(slide, 72, 80, 700, 48, text, { fontSize: 36, bold: true, color: C.bright });
  }

  // Helper: card with title
  function addCard(slide, left, top, width, height) {
    return slide.shapes.add({
      geometry: "roundRect",
      position: { left, top, width, height },
      fill: C.card,
      line: { style: "solid", fill: C.border, width: 1 },
      borderRadius: "rounded-xl",
    });
  }

  // ===================================================================
  // SLIDE 1 — Cover
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = GRAD;

    // Accent line
    s.shapes.add({
      geometry: "rect", position: { left: 72, top: 200, width: 80, height: 4 },
      fill: C.accent, line: { style: "solid", fill: "none", width: 0 },
    });

    addText(s, 72, 224, 800, 96, "数学SRS", { fontSize: 64, bold: true, color: C.bright });
    addText(s, 72, 324, 800, 48, "高中数学间隔重复学习系统", { fontSize: 28, color: C.accent2 });
    addText(s, 72, 388, 700, 80, "基于 SM-2 算法的局域网学习工具。Mac 运行后端，iPad / 手机浏览器访问。", { fontSize: 16, color: C.dim, lineSpacing: 1.5 });

    const techs = ["React 19", "FastAPI", "SQLite WAL", "KaTeX", "Tailwind CSS 4", "TypeScript 6"];
    let bx = 72;
    for (const t of techs) {
      s.shapes.add({
        geometry: "roundRect", position: { left: bx, top: 500, width: 105, height: 32 },
        fill: "rgba(168,85,247,0.15)", line: { style: "solid", fill: "rgba(168,85,247,0.3)", width: 1 },
        borderRadius: "rounded-full",
      });
      addText(s, bx, 504, 105, 28, t, { fontSize: 10, color: C.accent, align: "center" });
      bx += 115;
    }

    // Decorative ellipses
    s.shapes.add({ geometry: "ellipse", position: { left: 920, top: 100, width: 360, height: 360 }, fill: "rgba(96,165,250,0.06)", line: { style: "solid", fill: "rgba(96,165,250,0.12)", width: 1 } });
    s.shapes.add({ geometry: "ellipse", position: { left: 980, top: 160, width: 240, height: 240 }, fill: "rgba(168,85,247,0.06)", line: { style: "solid", fill: "rgba(168,85,247,0.12)", width: 1 } });
  }

  // ===================================================================
  // SLIDE 2 — Project Overview
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = C.bg;
    addSection(s, "PROJECT OVERVIEW");
    addTitle(s, "项目概述");

    const cards = [
      { label: "技术栈", value: "6 层", desc: "React 19 → FastAPI → SQLite\n全栈 TypeScript + Python", color: C.accent },
      { label: "数据源", value: "双模", desc: "浏览笔记 (Markdown) +\n复习题库 (Scheme B)", color: C.accent2 },
      { label: "访问端", value: "多端", desc: "Mac 服务端 + iPad / iPhone\n浏览器局域网访问", color: C.accent3 },
    ];

    for (let i = 0; i < cards.length; i++) {
      const cx = 72 + i * 252;
      addCard(s, cx, 160, 230, 200);
      addText(s, cx + 20, 180, 190, 40, cards[i].value, { fontSize: 28, bold: true, color: cards[i].color });
      addText(s, cx + 20, 222, 190, 24, cards[i].label, { fontSize: 12, bold: true, color: C.dim });
      addText(s, cx + 20, 256, 190, 80, cards[i].desc, { fontSize: 12, color: C.text, lineSpacing: 1.6 });
    }

    addText(s, 72, 400, 800, 180,
      "7 维学习笔记 × 2 种题型 × SM-2 算法\n\n" +
      "每张卡片覆盖 7 个认知维度：核心概念、解题策略、易错点、几何直觉、多维原理、知识关联、挑战题。\n" +
      "填空 (Cloze) 与选择 (Choice) 两种题型，覆盖精确记忆与识别判断。\n" +
      "SM-2 算法自动调度复习间隔，效率最大化。",
      { fontSize: 14, color: C.text, lineSpacing: 1.8 }
    );
  }

  // ===================================================================
  // SLIDE 3 — Architecture
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = C.bg;
    addSection(s, "ARCHITECTURE");
    addTitle(s, "技术架构");

    const layers = [
      { y: 160, h: 52, label: "iPad / Mac 浏览器", sub: "SPA · React 19 · Vite · Tailwind CSS 4", color: C.accent },
      { y: 232, h: 52, label: "HTTP REST API", sub: "FastAPI · uvicorn · CORS", color: C.accent2 },
      { y: 304, h: 52, label: "业务逻辑层", sub: "SM-2 算法 · Import/Export · Detexify 符号识别", color: C.accent3 },
      { y: 376, h: 52, label: "数据层", sub: "SQLite WAL · cards / srs_state / review_log 三表", color: C.amber },
    ];

    for (const ly of layers) {
      s.shapes.add({
        geometry: "roundRect", position: { left: 72, top: ly.y, width: 700, height: ly.h },
        fill: "rgba(15,23,42,0.7)", line: { style: "solid", fill: C.border, width: 1 }, borderRadius: "rounded-lg",
      });
      addText(s, 96, ly.y + 6, 350, 22, ly.label, { fontSize: 15, bold: true, color: ly.color });
      addText(s, 96, ly.y + 28, 600, 20, ly.sub, { fontSize: 11, color: C.dim });
    }

    const details = [
      { y: 160, label: "前端模块", value: "15 组件 + 2K+ modules" },
      { y: 232, label: "后端 API", value: "18 个 REST endpoint" },
      { y: 304, label: "测试覆盖", value: "62 个 (pytest + vitest)" },
    ];
    for (const d of details) {
      addCard(s, 830, d.y, 370, 52);
      addText(s, 850, d.y + 6, 330, 18, d.label, { fontSize: 10, color: C.dim });
      addText(s, 850, d.y + 26, 330, 20, d.value, { fontSize: 13, bold: true, color: C.accent2 });
    }
  }

  // ===================================================================
  // SLIDE 4 — Dual Data Sources
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = C.bg;
    addSection(s, "DATA MODEL");
    addTitle(s, "双数据源设计");

    // Left: Browse
    addCard(s, 72, 156, 520, 300);
    addText(s, 96, 176, 460, 28, "📖 浏览卡片 — 学习笔记", { fontSize: 18, bold: true, color: C.accent });
    addText(s, 96, 212, 460, 220,
      "存储: public/data/browse/*.json\n格式: Markdown + KaTeX 数学公式\n\n7 个内容维度:\n" +
      "  📖 核心概念 — 定义、公理、符号\n" +
      "  🧠 解题策略 — SOP 标准步骤\n" +
      "  ⚠️ 易错点 — 常见错误 + 辨析\n" +
      "  💡 多维原理 — 代数/几何/逻辑视角\n" +
      "  🧪 经典例题 — 例题 + 完整解答\n" +
      "  🔗 知识关联 — 跨章节连接\n" +
      "  🕸 思维挑战 — 拔高题与拓展",
      { fontSize: 11, color: C.text, lineSpacing: 1.7 }
    );

    // Right: Review
    addCard(s, 640, 156, 540, 300);
    addText(s, 664, 176, 480, 28, "🧠 复习卡片 — SRS 题库", { fontSize: 18, bold: true, color: C.accent2 });
    addText(s, 664, 212, 480, 220,
      "存储: SQLite cards 表 ← cards.json seed\n格式: Scheme B (cloze + choice)\n\n2 种测试题型:\n" +
      "  ✏️ 填空 (Cloze) — 精确回忆\n" +
      "     `x = [[1]]，y = [[2]]` → 填入答案\n" +
      "  🔘 选择 (Choice) — 识别判断\n" +
      "     4 选项 · Fisher-Yates 乱序\n\n" +
      "SM-2 算法自动调度复习:\n" +
      "  正确 → 间隔延长 · 错误 → 重置为 1 天",
      { fontSize: 11, color: C.text, lineSpacing: 1.7 }
    );

    addText(s, 72, 480, 1100, 40,
      "💡 双源独立：浏览用于学习理解，复习用于记忆巩固。数据通过 textbook.json 中的章节 ID 关联。",
      { fontSize: 13, color: C.amber, lineSpacing: 1.5 }
    );
  }

  // ===================================================================
  // SLIDE 5 — SM-2 Algorithm
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = C.bg;
    addSection(s, "ALGORITHM");
    addTitle(s, "SM-2 间隔重复算法");

    // Rules card
    addCard(s, 72, 156, 520, 240);
    addText(s, 96, 172, 460, 24, "算法规则", { fontSize: 15, bold: true, color: C.accent });
    addText(s, 96, 204, 460, 180,
      "评分: 3 (正确) / 0 (错误)\n\n" +
      "正确时:\n" +
      "  • 首次复习 → interval = 1 天\n" +
      "  • 第二次 → interval = 6 天\n" +
      "  • 第三次+ → interval = max(1, int(interval × ef))\n" +
      "  • ease_factor += 0.1\n\n" +
      "错误时:\n" +
      "  • interval 重置为 1 天\n" +
      "  • reps 归零\n" +
      "  • ease_factor -= 0.2 (下限 1.3)",
      { fontSize: 11, color: C.text, lineSpacing: 1.6 }
    );

    // Example card
    addCard(s, 640, 156, 540, 240);
    addText(s, 664, 172, 480, 24, "示例: 集合的概念 (01-01)", { fontSize: 15, bold: true, color: C.accent2 });
    addText(s, 664, 204, 480, 180,
      "Day 1 — 首次复习「核心定义」→ ✅ 正确\n" +
      "         interval=1, ef=2.6, reps=1\n\n" +
      "Day 2 — 第二次复习「核心定义」→ ✅ 正确\n" +
      "         interval=6, ef=2.7, reps=2\n\n" +
      "Day 8 — 第三次复习 → ✅ 正确\n" +
      "         interval=ceil(6×2.7)=17, ef=2.8\n\n" +
      "Day 25 — 第 4 次复习 → ❌ 错误\n" +
      "         interval=1, ef=2.6, reps=0",
      { fontSize: 11, color: C.text, lineSpacing: 1.6 }
    );

    // Timeline
    addCard(s, 72, 420, 1128, 150);
    addText(s, 96, 436, 400, 24, "间隔增长曲线", { fontSize: 14, bold: true, color: C.accent3 });

    const points = [
      { day: 1, intv: 1, label: "D1" },
      { day: 2, intv: 6, label: "D2" },
      { day: 8, intv: 17, label: "D8" },
      { day: 25, intv: 46, label: "D25" },
      { day: 71, intv: 125, label: "D71" },
    ];
    const tx = 96, ty = 480, tw = 1000, maxDay = 71, maxInt = 125;
    for (const p of points) {
      const x = tx + (p.day / maxDay) * tw;
      const y = ty + 36 - (p.intv / maxInt) * 32;
      s.shapes.add({ geometry: "ellipse", position: { left: x - 4, top: y - 4, width: 8, height: 8 }, fill: C.accent, line: { style: "solid", fill: "none", width: 0 } });
      addText(s, x - 20, y + 8, 60, 14, `${p.label} (${p.intv}d)`, { fontSize: 9, color: C.dim, align: "center" });
    }
    s.shapes.add({ geometry: "rect", position: { left: tx, top: ty + 36, width: tw, height: 1 }, fill: C.border, line: { style: "solid", fill: "none", width: 0 } });
    addText(s, tx, ty + 44, tw, 36,
      "正确复习 → 间隔指数级增长。首次 1 天 → 第 5 次 125 天 → 约 4 个月后再次复习。\n一次错误 → 间隔重置为 1 天，效率损失约 99%。精准记忆是关键。",
      { fontSize: 10, color: C.dim, lineSpacing: 1.5 }
    );
  }

  // ===================================================================
  // SLIDE 6 — Browse Mode
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = C.bg;
    addSection(s, "FEATURE");
    addTitle(s, "浏览模式 — 7 维学习笔记");

    const dims = [
      { label: "核心概念", icon: "📖", desc: "集合定义: 元素 ∈ / ∉\n互异性/无序性/确定性", c: "#a855f7" },
      { label: "解题策略", icon: "🧠", desc: "数学语言翻译法\n自然语言 → 集合运算", c: "#3b82f6" },
      { label: "易错点", icon: "⚠️", desc: "∅ 与 {0} 的区别\n∈ 与 ⊆ 的混用", c: "#f43f5e" },
      { label: "多维原理", icon: "💡", desc: "交换律: A∪B = B∪A\n德摩根律: ∁(A∩B)", c: "#8b5cf6" },
      { label: "经典例题", icon: "🧪", desc: "例: A={1,2}, B={1,3}\n求A∪B = {1,2,3}", c: "#10b981" },
      { label: "知识关联", icon: "🔗", desc: "集合 → 不等式解集\n集合 → 函数定义域", c: "#06b6d4" },
      { label: "思维挑战", icon: "🕸", desc: "集合中元素个数\n容斥原理: |A∪B|", c: "#f59e0b" },
    ];

    const gx = 72, gy = 156, gw = 160, gh = 148, gap = 12;
    for (let i = 0; i < dims.length; i++) {
      const col = i % 4, row = Math.floor(i / 4);
      const x = gx + col * (gw + gap), y = gy + row * (gh + gap);
      addCard(s, x, y, gw, gh);
      addText(s, x + 8, y + 8, 28, 24, dims[i].icon, { fontSize: 16 });
      addText(s, x + 38, y + 10, 110, 18, dims[i].label, { fontSize: 12, bold: true, color: dims[i].c });
      addText(s, x + 8, y + 38, gw - 16, 100, dims[i].desc, { fontSize: 9, color: C.text, lineSpacing: 1.5 });
    }

    // Sidebar preview
    addCard(s, 780, 156, 420, 300);
    addText(s, 800, 172, 380, 24, "📐 课本目录树", { fontSize: 14, bold: true, color: C.accent });
    addText(s, 800, 204, 380, 240,
      "▼ 📖 第一册\n" +
      "  ▼ 第一章 集合与常用逻辑用语\n" +
      "    📖 01-01 集合的概念        ←已选\n" +
      "    📖 01-02 集合间的基本关系\n" +
      "        01-03 集合的基本运算   ←灰色\n\n" +
      "点击节编号 → 7 维网格\n" +
      "点击维度方格 → 全宽详情页\n" +
      "  → Markdown + KaTeX 公式\n" +
      "  → 上/下节导航按钮\n\n" +
      "示例: 01-01「核心概念」\n" +
      "→ 集合三特征 + ∈/∉ 符号 + 常用数集",
      { fontSize: 10, color: C.text, lineSpacing: 1.6 }
    );
  }

  // ===================================================================
  // SLIDE 7 — Review Mode Flow
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = C.bg;
    addSection(s, "FEATURE");
    addTitle(s, "复习模式 — 完整流程");

    const steps = [
      { x: 72, label: "选题页", desc: "7 维网格\n绿=✅ 已掌握\n红=❌ 未通过\n灰=待复习" },
      { x: 310, label: "40s 预览", desc: "显示题目+答案\n进度条倒计时\n记忆黄金期" },
      { x: 548, label: "进入测试", desc: "Cloze: 填空输入\nChoice: 点击选择" },
      { x: 786, label: "即时评分", desc: "全对 = 3 分\n有错 = 0 分\nSM-2 更新" },
      { x: 1024, label: "自动流转", desc: "→ 下一维度\n→ 下一张卡片\n→ 复习完成" },
    ];

    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      addCard(s, st.x, 156, 210, 200);
      // Step number circle
      const ni = i + 1;
      s.shapes.add({ geometry: "ellipse", position: { left: st.x + 10, top: 166, width: 28, height: 28 }, fill: "rgba(168,85,247,0.3)", line: { style: "solid", fill: C.accent, width: 1 } });
      addText(s, st.x + 10, 170, 28, 24, String(ni), { fontSize: 12, bold: true, color: C.bright, align: "center" });
      addText(s, st.x + 46, 170, 150, 20, st.label, { fontSize: 13, bold: true, color: C.accent });
      addText(s, st.x + 10, 210, 180, 130, st.desc, { fontSize: 10, color: C.text, lineSpacing: 1.6 });

      if (i < steps.length - 1) {
        s.shapes.add({ geometry: "rect", position: { left: st.x + 210, top: 256, width: 100, height: 2 }, fill: C.accent, line: { style: "solid", fill: "none", width: 0 } });
        s.shapes.add({ geometry: "triangle", position: { left: st.x + 304, top: 250, width: 10, height: 14 }, fill: C.accent, line: { style: "solid", fill: "none", width: 0 } });
      }
    }

    // Safety card
    addCard(s, 72, 388, 540, 180);
    addText(s, 96, 404, 480, 24, "安全限制", { fontSize: 13, bold: true, color: C.rose });
    addText(s, 96, 432, 480, 120,
      "测试阶段强制禁用:\n" +
      "  • Ctrl+V / Cmd+V — 禁止粘贴\n" +
      "  • Ctrl+C / Cmd+C — 禁止复制\n" +
      "  • 右键菜单 — 禁止 contextmenu\n\n" +
      "手写草稿板 (Canvas): Apple Pencil 手写演算，切换题目自动清空",
      { fontSize: 10, color: C.text, lineSpacing: 1.6 }
    );

    // Completion card
    addCard(s, 660, 388, 540, 180);
    addText(s, 684, 404, 480, 24, "全维度完成后", { fontSize: 13, bold: true, color: C.green });
    addText(s, 684, 432, 480, 120,
      "一张卡片 7 维全部通过:\n" +
      "  • 显示「下一张 →」按钮\n" +
      "  • 自动加载下一张待复习卡片\n\n" +
      "全部卡片复习完毕:\n" +
      "  🎉 今日复习完成！没有待复习的卡片\n\n" +
      "统计: 正确数/总数 + 正确率",
      { fontSize: 10, color: C.text, lineSpacing: 1.6 }
    );
  }

  // ===================================================================
  // SLIDE 8 — Quiz Examples
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = C.bg;
    addSection(s, "EXAMPLES");
    addTitle(s, "题型示例 — Cloze vs Choice");

    // Cloze
    addCard(s, 72, 156, 540, 300);
    s.shapes.add({ geometry: "roundRect", position: { left: 84, top: 168, width: 90, height: 24 }, fill: "rgba(168,85,247,0.2)", line: { style: "solid", fill: C.accent, width: 1 }, borderRadius: "rounded-full" });
    addText(s, 84, 170, 90, 20, "✏️ 填空 (Cloze)", { fontSize: 9, bold: true, color: C.accent, align: "center" });
    addText(s, 84, 204, 500, 36, "题: 集合的三个基本特征是 ____、____、____。", { fontSize: 13, color: C.bright });
    addText(s, 84, 248, 500, 60, "✓ 答: 确定性、互异性、无序性\n  用户输入后 NFKC 归一化: A (U+0041) ≡ Ａ (U+FF21)", { fontSize: 11, color: C.green, lineSpacing: 1.5 });
    addText(s, 84, 320, 500, 100, "评分: 全部填空正确 → 3 分\n      任意填空错误 → 0 分（显示正确答案）\n答案格式: answer: [\"确定性\", \"互异性\", \"无序性\"]", { fontSize: 10, color: C.dim, lineSpacing: 1.5 });

    // Choice
    addCard(s, 660, 156, 540, 300);
    s.shapes.add({ geometry: "roundRect", position: { left: 672, top: 168, width: 90, height: 24 }, fill: "rgba(96,165,250,0.2)", line: { style: "solid", fill: C.accent2, width: 1 }, borderRadius: "rounded-full" });
    addText(s, 672, 170, 90, 20, "🔘 选择 (Choice)", { fontSize: 9, bold: true, color: C.accent2, align: "center" });
    addText(s, 672, 204, 500, 24, "题: 下列关系式中正确的是？", { fontSize: 13, color: C.bright });
    addText(s, 672, 240, 500, 100, "A. 0 ∈ ∅\nB. ∅ ⊆ {0}          ← 正确答案\nC. 0 = ∅\nD. {∅} = ∅", { fontSize: 11, color: C.text, lineSpacing: 1.6 });
    addText(s, 672, 340, 500, 100, "评分: 选 B → 3 分 (绿色标注)\n      选 A/C/D → 0 分 (红色标注，正确项标绿)\n选项顺序: Fisher-Yates 随机打乱，每次不同", { fontSize: 10, color: C.dim, lineSpacing: 1.5 });

    addCard(s, 72, 480, 1128, 80);
    addText(s, 96, 496, 400, 20, "题型设计原则", { fontSize: 12, bold: true, color: C.accent });
    addText(s, 96, 520, 1060, 36, "Cloze 测试精确回忆（回顾+生成）→ 高认知负荷，加深记忆。Choice 测试识别判断（匹配+区分）→ 低认知负荷，快速验证。两者互补，覆盖完整记忆曲线。", { fontSize: 10, color: C.text, lineSpacing: 1.5 });
  }

  // ===================================================================
  // SLIDE 9 — Handwriting + Bank
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = C.bg;
    addSection(s, "FEATURE");
    addTitle(s, "手写识别 + 题库管理");

    addCard(s, 72, 156, 540, 300);
    addText(s, 96, 172, 480, 24, "🖊️ 手写符号识别 (Detexify)", { fontSize: 14, bold: true, color: C.accent3 });
    addText(s, 96, 208, 480, 240,
      "Canvas 手写板 → DTW + k-NN 分类\n\n" +
      "预处理流水线:\n" +
      "  去重 → 平滑 → 重采样(32点) → 归一化 → 主方向对齐\n\n" +
      "分类: 动态时间规整 (DTW) 距离\n" +
      "  取 2 个最近样本均值 → top-5 候选\n" +
      "  置信度 = 1 / (1 + meanDistance)\n\n" +
      "训练数据: 200+ 常用 LaTeX 符号\n" +
      "  支持 ∈, ⊆, ∪, ∩, ∀, ∃, ∑, ∏, ∂, ∇ 等",
      { fontSize: 10, color: C.text, lineSpacing: 1.5 }
    );

    addCard(s, 660, 156, 540, 300);
    addText(s, 684, 172, 480, 24, "📊 题库模式 (BankMode)", { fontSize: 14, bold: true, color: C.green });
    addText(s, 684, 208, 480, 240,
      "三张统计卡片:\n" +
      "  • 总卡片数 — 题库全部卡片\n" +
      "  • 待复习 — 今日到期数量\n" +
      "  • 已掌握 — 未到期数量\n\n" +
      "SRS 状态表格:\n" +
      "  ID / 标题 / 分类 / 复习次数\n" +
      "  当前间隔 / 难度因子 / 到期日 / 状态\n\n" +
      "状态指示:\n" +
      "  🟤 新卡片 — 从未复习\n" +
      "  🟡 待复习 — 今日到期\n" +
      "  🟢 已掌握 — 未到期",
      { fontSize: 10, color: C.text, lineSpacing: 1.5 }
    );

    addCard(s, 72, 480, 1128, 90);
    addText(s, 96, 496, 400, 20, "📐 数学符号面板 (MathSymbolPad)", { fontSize: 12, bold: true, color: C.amber });
    addText(s, 96, 520, 1060, 40,
      "6 组符号: 集合 (∈, ⊆, ∪) · 逻辑 (∀, ∃, ∧) · 运算 (±, ×, √) · 比较 (≤, ≥, ≠) · 希腊 (α, β, π) · 角标 (₁, ₂, ³)\n" +
      "点击插入填空输入框，Apple Pencil 友好。Canvas 手写草稿板辅助演算。",
      { fontSize: 10, color: C.text, lineSpacing: 1.5 }
    );
  }

  // ===================================================================
  // SLIDE 10 — Data Management + Deployment
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = C.bg;
    addSection(s, "OPERATIONS");
    addTitle(s, "数据管理 + 部署运维");

    addCard(s, 72, 156, 540, 220);
    addText(s, 96, 172, 480, 24, "📦 导入 / 导出", { fontSize: 14, bold: true, color: C.accent });
    addText(s, 96, 204, 480, 160,
      "导入:\n" +
      "  • 粘贴 JSON → INSERT OR REPLACE\n" +
      "  • 同 ID 覆盖，旧 SRS 状态清除\n" +
      "  • 新卡片标记 source=\"imported\"\n\n" +
      "导出 (4 种格式):\n" +
      "  📄 全部卡片 (JSON) — 数据迁移\n" +
      "  📊 复习进度 (JSON) — srs + log\n" +
      "  📈 复习统计 (CSV) — Excel 可打开\n" +
      "  🗜️ 完整备份 (ZIP) — 三合一",
      { fontSize: 10, color: C.text, lineSpacing: 1.5 }
    );

    addCard(s, 660, 156, 540, 220);
    addText(s, 684, 172, 480, 24, "🚀 一键部署", { fontSize: 14, bold: true, color: C.accent2 });
    addText(s, 684, 204, 480, 160,
      "启动命令:\n" +
      "  $ env PYTHONPATH=. \\\\\n" +
      "    .venv/bin/uvicorn server.main:app \\\\\n" +
      "    --host 0.0.0.0 --port 3000\n\n" +
      "三部曲:\n" +
      "  ① python3 -m venv .venv\n" +
      "  ② pip install -r requirements.txt\n" +
      "  ③ npm install && npm run build\n\n" +
      "数据重置:\n" +
      "  rm data/cards.db* → 重启自动 seed",
      { fontSize: 10, color: C.text, lineSpacing: 1.5 }
    );

    addCard(s, 72, 404, 1128, 120);
    addText(s, 96, 420, 400, 20, "🌐 局域网访问 + 离线保障", { fontSize: 12, bold: true, color: C.amber });
    addText(s, 96, 448, 1060, 60,
      "Mac 查看 IP: ipconfig getifaddr en0 → 例如 192.168.1.5\n" +
      "iPad Safari 访问: http://192.168.1.5:3000 → 添加到主屏幕（类 App 体验）\n" +
      "离线检测: 15s 健康检查轮询，离线时黄色横幅提示「仅浏览模式可用」\n" +
      "SPA fallback: 刷新任意路径不白屏",
      { fontSize: 10, color: C.text, lineSpacing: 1.5 }
    );
  }

  // ===================================================================
  // SLIDE 11 — Summary
  // ===================================================================
  {
    const s = presentation.slides.add();
    s.background.fill = GRAD;

    s.shapes.add({ geometry: "rect", position: { left: 72, top: 120, width: 80, height: 4 }, fill: C.accent, line: { style: "solid", fill: "none", width: 0 } });
    addText(s, 72, 144, 800, 64, "项目亮点", { fontSize: 40, bold: true, color: C.bright });

    const highlights = [
      "🧠  科学记忆 — SM-2 算法 + 7 维认知模型，覆盖完整学习曲线",
      "📖  双源独立 — 浏览笔记与复习题库分离，学习与巩固各司其职",
      "🎯  精准测试 — Cloze 精确回忆 + Choice 识别判断，两种题型互补",
      "📐  数学优先 — KaTeX 渲染 + Detexify 手写符号识别 + 符号面板",
      "🌐  零配置部署 — 3 条命令启动，局域网多端访问，SPA fallback",
      "🔒  本地运行 — SQLite WAL 存储，数据不上传，完全隐私安全",
      "🖊️  Apple Pencil — Canvas 手写草稿 + 符号识别，Pad 原生体验",
      "📊  数据可控 — 4 种导出格式，JSON/CSV/ZIP 自由迁移备份",
    ];

    for (let i = 0; i < highlights.length; i++) {
      addText(s, 72, 232 + i * 42, 900, 36, highlights[i], { fontSize: 16, color: C.text, lineSpacing: 1.5 });
    }

    addCard(s, 72, 580, 1128, 56);
    addText(s, 96, 592, 1060, 36,
      "React 19  ·  TypeScript 6  ·  Vite 8  ·  FastAPI  ·  SQLite WAL  ·  KaTeX  ·  Tailwind CSS 4  ·  Lucide  ·  pytest  ·  vitest",
      { fontSize: 10, color: C.dim, align: "center", lineSpacing: 1.5 }
    );
  }

  // ── Render previews ──
  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await presentation.export({ slide, format: "png", scale: 1 });
    await writeBlob(`${PREVIEW_DIR}/${stem}.png`, png);
    const layout = await slide.export({ format: "layout" });
    await writeText(`${LAYOUT_DIR}/${stem}.layout.json`, await layout.text());
  }

  const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
  await writeBlob(`${PREVIEW_DIR}/deck-montage.webp`, montage);

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);

  console.log(`✅ Deck saved to ${FINAL_PPTX}`);
  console.log(`✅ ${presentation.slides.items.length} slides, previews in ${PREVIEW_DIR}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
