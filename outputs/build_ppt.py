"""Build math-srs presentation deck using python-pptx."""

import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

# Color palette
class C:
    BG = RGBColor(0x0A, 0x0E, 0x1A)
    CARD = RGBColor(0x0F, 0x17, 0x2A)
    BORDER = RGBColor(0x1E, 0x29, 0x3B)
    ACCENT = RGBColor(0xA8, 0x55, 0xF7)  # purple
    ACCENT2 = RGBColor(0x60, 0xA5, 0xFA)  # blue
    ACCENT3 = RGBColor(0x22, 0xD3, 0xEE)  # cyan
    TEXT = RGBColor(0xE2, 0xE8, 0xF0)
    DIM = RGBColor(0x64, 0x74, 0x8B)
    BRIGHT = RGBColor(0xF8, 0xFA, 0xFC)
    GREEN = RGBColor(0x4A, 0xDE, 0x80)
    AMBER = RGBColor(0xFB, 0xBF, 0x24)
    ROSE = RGBColor(0xFB, 0x71, 0x85)


prs = Presentation()
prs.slide_width = SLIDE_W
prs.slide_height = SLIDE_H

# Use blank layout
blank_layout = prs.slide_layouts[6]  # blank


def add_slide():
    """Add a blank slide with dark background."""
    slide = prs.slides.add_slide(blank_layout)
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = C.BG
    return slide


def add_shape(slide, left, top, width, height, fill_color=C.CARD, border_color=C.BORDER, radius=None):
    """Add a rounded rectangle shape."""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.color.rgb = border_color
    shape.line.width = Pt(1)
    if radius:
        shape.adjustments[0] = radius
    return shape


def add_rect(slide, left, top, width, height, fill_color):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.fill.background()
    return shape


def add_textbox(slide, left, top, width, height, text, font_size=14, color=C.TEXT, bold=False, align=PP_ALIGN.LEFT, line_spacing=1.0):
    """Add a textbox with styled text."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.alignment = align
    p.space_after = Pt(line_spacing * font_size * 0.3)
    return txBox


def add_multiline_textbox(slide, left, top, width, height, text, font_size=11, color=C.TEXT, bold=False, line_spacing=1.0):
    """Multi-line textbox with proper line spacing."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = line if line else ' '
        p.font.size = Pt(font_size)
        p.font.color.rgb = color
        p.font.bold = bold
        p.space_after = Pt(2)
    return txBox


def section_header(slide, label):
    add_textbox(slide, Inches(0.75), Inches(0.5), Inches(4), Inches(0.3),
                label, font_size=12, color=C.ACCENT, bold=True)

def page_title(slide, text):
    add_textbox(slide, Inches(0.75), Inches(0.85), Inches(8), Inches(0.6),
                text, font_size=32, color=C.BRIGHT, bold=True)


# ===================================================================
# SLIDE 1 — Cover
# ===================================================================
slide = add_slide()

# Gradient overlay (approximate with two boxes)
add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, RGBColor(0x1A, 0x05, 0x33))
add_rect(slide, Inches(3), 0, SLIDE_W, SLIDE_H, RGBColor(0x0A, 0x16, 0x28))

# Accent line
add_rect(slide, Inches(0.75), Inches(2.1), Inches(0.8), Pt(4), C.ACCENT)

add_textbox(slide, Inches(0.75), Inches(2.4), Inches(8), Inches(1.0),
            "数学SRS", font_size=56, color=C.BRIGHT, bold=True)
add_textbox(slide, Inches(0.75), Inches(3.4), Inches(8), Inches(0.6),
            "高中数学间隔重复学习系统", font_size=26, color=C.ACCENT2)
add_multiline_textbox(slide, Inches(0.75), Inches(4.15), Inches(8), Inches(0.8),
            "基于 SM-2 算法的局域网学习工具。Mac 运行后端，iPad / 手机浏览器访问。",
            font_size=15, color=C.DIM, line_spacing=1.5)

# Tech badges
techs = ["React 19", "FastAPI", "SQLite WAL", "KaTeX", "Tailwind CSS 4", "TypeScript 6"]
bx = Inches(0.75)
for t in techs:
    badge = add_shape(slide, bx, Inches(5.3), Inches(1.1), Inches(0.35),
                      RGBColor(0x2A, 0x15, 0x4A), RGBColor(0x5B, 0x2A, 0x8A))
    badge.adjustments[0] = 0.5
    add_textbox(slide, bx, Inches(5.33), Inches(1.1), Inches(0.3),
                t, font_size=10, color=C.ACCENT, align=PP_ALIGN.CENTER)
    bx += Inches(1.2)

# Decorative circles
c1 = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9.5), Inches(1.0), Inches(3.5), Inches(3.5))
c1.fill.solid(); c1.fill.fore_color.rgb = RGBColor(0x0A, 0x2A, 0x50)
c1.line.color.rgb = RGBColor(0x0A, 0x3A, 0x60); c1.line.width = Pt(1)
c1.fill.fore_color.brightness = 0.0

c2 = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(10.2), Inches(1.6), Inches(2.5), Inches(2.5))
c2.fill.solid(); c2.fill.fore_color.rgb = RGBColor(0x1A, 0x0A, 0x33)
c2.line.color.rgb = RGBColor(0x2A, 0x1A, 0x44); c2.line.width = Pt(1)

# ===================================================================
# SLIDE 2 — Project Overview
# ===================================================================
slide = add_slide()
section_header(slide, "PROJECT OVERVIEW")
page_title(slide, "项目概述")

# Three stat cards
cards_data = [
    ("6 层", "技术栈", "React 19 → FastAPI → SQLite\n全栈 TypeScript + Python", C.ACCENT),
    ("双模", "数据源", "浏览笔记 (Markdown) +\n复习题库 (Scheme B)", C.ACCENT2),
    ("多端", "访问端", "Mac 服务端 + iPad / iPhone\n浏览器局域网访问", C.ACCENT3),
]
for i, (val, label, desc, color) in enumerate(cards_data):
    x = Inches(0.75 + i * 2.6)
    add_shape(slide, x, Inches(1.7), Inches(2.35), Inches(1.9))
    add_textbox(slide, x + Inches(0.15), Inches(1.85), Inches(2.0), Inches(0.4),
                val, font_size=26, color=color, bold=True)
    add_textbox(slide, x + Inches(0.15), Inches(2.25), Inches(2.0), Inches(0.25),
                label, font_size=12, color=C.DIM, bold=True)
    add_multiline_textbox(slide, x + Inches(0.15), Inches(2.6), Inches(2.0), Inches(0.8),
                desc, font_size=11, color=C.TEXT, line_spacing=1.5)

add_multiline_textbox(slide, Inches(0.75), Inches(4.0), Inches(8.5), Inches(2.5),
    "7 维学习笔记 × 2 种题型 × SM-2 算法\n\n"
    "每张卡片覆盖 7 个认知维度：核心概念、解题策略、易错点、几何直觉、多维原理、知识关联、挑战题。\n"
    "填空 (Cloze) 与选择 (Choice) 两种题型，覆盖精确记忆与识别判断。\n"
    "SM-2 算法自动调度复习间隔，效率最大化。",
    font_size=14, color=C.TEXT, line_spacing=1.8)

# ===================================================================
# SLIDE 3 — Architecture
# ===================================================================
slide = add_slide()
section_header(slide, "ARCHITECTURE")
page_title(slide, "技术架构")

layers = [
    (Inches(1.7), Inches(0.55), "iPad / Mac 浏览器", "SPA · React 19 · Vite · Tailwind CSS 4", C.ACCENT),
    (Inches(2.5), Inches(0.55), "HTTP REST API", "FastAPI · uvicorn · CORS", C.ACCENT2),
    (Inches(3.3), Inches(0.55), "业务逻辑层", "SM-2 算法 · Import/Export · Detexify 符号识别", C.ACCENT3),
    (Inches(4.1), Inches(0.55), "数据层", "SQLite WAL · cards / srs_state / review_log 三表", C.AMBER),
]
for y, h, label, sub, color in layers:
    add_shape(slide, Inches(0.75), y, Inches(7.5), h)
    add_textbox(slide, Inches(1.0), y + Inches(0.05), Inches(4), Inches(0.25),
                label, font_size=15, color=color, bold=True)
    add_textbox(slide, Inches(1.0), y + Inches(0.3), Inches(6), Inches(0.2),
                sub, font_size=11, color=C.DIM)

details = [
    (Inches(1.7), "前端模块", "15 组件 + 2K+ modules"),
    (Inches(2.5), "后端 API", "18 个 REST endpoint"),
    (Inches(3.3), "测试覆盖", "62 个 (pytest + vitest)"),
]
for y, label, val in details:
    add_shape(slide, Inches(8.8), y, Inches(3.8), Inches(0.55))
    add_textbox(slide, Inches(9.0), y + Inches(0.02), Inches(3.5), Inches(0.2),
                label, font_size=10, color=C.DIM)
    add_textbox(slide, Inches(9.0), y + Inches(0.25), Inches(3.5), Inches(0.25),
                val, font_size=13, color=C.ACCENT2, bold=True)

# ===================================================================
# SLIDE 4 — Dual Data Sources
# ===================================================================
slide = add_slide()
section_header(slide, "DATA MODEL")
page_title(slide, "双数据源设计")

# Left: Browse
add_shape(slide, Inches(0.75), Inches(1.65), Inches(5.8), Inches(3.5))
add_textbox(slide, Inches(1.0), Inches(1.85), Inches(5.0), Inches(0.35),
            "📖 浏览卡片 — 学习笔记", font_size=18, color=C.ACCENT, bold=True)
add_multiline_textbox(slide, Inches(1.0), Inches(2.3), Inches(5.0), Inches(2.7),
    "存储: public/data/browse/*.json\n格式: Markdown + KaTeX 数学公式\n\n"
    "7 个内容维度:\n"
    "  📖 核心概念 — 定义、公理、符号\n"
    "  🧠 解题策略 — SOP 标准步骤\n"
    "  ⚠️ 易错点 — 常见错误 + 辨析\n"
    "  💡 多维原理 — 代数/几何/逻辑视角\n"
    "  🧪 经典例题 — 例题 + 完整解答\n"
    "  🔗 知识关联 — 跨章节连接\n"
    "  🕸 思维挑战 — 拔高题与拓展",
    font_size=11, color=C.TEXT, line_spacing=1.7)

# Right: Review
add_shape(slide, Inches(6.9), Inches(1.65), Inches(5.8), Inches(3.5))
add_textbox(slide, Inches(7.15), Inches(1.85), Inches(5.0), Inches(0.35),
            "🧠 复习卡片 — SRS 题库", font_size=18, color=C.ACCENT2, bold=True)
add_multiline_textbox(slide, Inches(7.15), Inches(2.3), Inches(5.0), Inches(2.7),
    "存储: SQLite cards 表 ← cards.json seed\n格式: Scheme B (cloze + choice)\n\n"
    "2 种测试题型:\n"
    "  ✏️ 填空 (Cloze) — 精确回忆\n"
    "     `x = [[1]]，y = [[2]]` → 填入答案\n"
    "  🔘 选择 (Choice) — 识别判断\n"
    "     4 选项 · Fisher-Yates 乱序\n\n"
    "SM-2 算法自动调度复习:\n"
    "  正确 → 间隔延长 · 错误 → 重置为 1 天",
    font_size=11, color=C.TEXT, line_spacing=1.7)

add_multiline_textbox(slide, Inches(0.75), Inches(5.4), Inches(12), Inches(0.5),
    "💡 双源独立：浏览用于学习理解，复习用于记忆巩固。数据通过 textbook.json 中的章节 ID 关联。",
    font_size=13, color=C.AMBER, line_spacing=1.5)

# ===================================================================
# SLIDE 5 — SM-2 Algorithm
# ===================================================================
slide = add_slide()
section_header(slide, "ALGORITHM")
page_title(slide, "SM-2 间隔重复算法")

# Rules card
add_shape(slide, Inches(0.75), Inches(1.65), Inches(5.5), Inches(3.2))
add_textbox(slide, Inches(1.0), Inches(1.85), Inches(4.5), Inches(0.3),
            "算法规则", font_size=15, color=C.ACCENT, bold=True)
add_multiline_textbox(slide, Inches(1.0), Inches(2.25), Inches(4.8), Inches(2.5),
    "评分: 3 (正确) / 0 (错误)\n\n"
    "正确时:\n"
    "  • 首次复习 → interval = 1 天\n"
    "  • 第二次 → interval = 6 天\n"
    "  • 第三次+ → interval = max(1, int(interval × ef))\n"
    "  • ease_factor += 0.1\n\n"
    "错误时:\n"
    "  • interval 重置为 1 天\n"
    "  • reps 归零\n"
    "  • ease_factor -= 0.2 (下限 1.3)",
    font_size=11, color=C.TEXT, line_spacing=1.6)

# Example card
add_shape(slide, Inches(6.55), Inches(1.65), Inches(5.8), Inches(3.2))
add_textbox(slide, Inches(6.8), Inches(1.85), Inches(5.0), Inches(0.3),
            "示例: 集合的概念 (01-01)", font_size=15, color=C.ACCENT2, bold=True)
add_multiline_textbox(slide, Inches(6.8), Inches(2.25), Inches(5.2), Inches(2.5),
    "Day 1 — 首次复习「核心定义」→ ✅ 正确\n"
    "         interval=1, ef=2.6, reps=1\n\n"
    "Day 2 — 第二次复习「核心定义」→ ✅ 正确\n"
    "         interval=6, ef=2.7, reps=2\n\n"
    "Day 8 — 第三次复习 → ✅ 正确\n"
    "         interval=ceil(6×2.7)=17, ef=2.8\n\n"
    "Day 25 — 第 4 次复习 → ❌ 错误\n"
    "         interval=1, ef=2.6, reps=0",
    font_size=11, color=C.TEXT, line_spacing=1.6)

# Timeline card
add_shape(slide, Inches(0.75), Inches(5.1), Inches(11.6), Inches(2.0))
add_textbox(slide, Inches(1.0), Inches(5.25), Inches(4), Inches(0.3),
            "间隔增长曲线", font_size=14, color=C.ACCENT3, bold=True)
add_multiline_textbox(slide, Inches(1.0), Inches(5.6), Inches(11), Inches(1.2),
    "正确复习 → 间隔指数级增长。首次 1 天 → 第 5 次 125 天 → 约 4 个月后再次复习。\n"
    "一次错误 → 间隔重置为 1 天，效率损失约 99%。精准记忆是关键。",
    font_size=11, color=C.DIM, line_spacing=1.5)

# ===================================================================
# SLIDE 6 — Browse Mode
# ===================================================================
slide = add_slide()
section_header(slide, "FEATURE")
page_title(slide, "浏览模式 — 7 维学习笔记")

# 7 dimension items in a grid
dims = [
    ("📖", "核心概念", "集合定义: 元素 ∈ / ∉\n互异性/无序性/确定性", C.ACCENT),
    ("🧠", "解题策略", "数学语言翻译法\n自然语言 → 集合运算", C.ACCENT2),
    ("⚠️", "易错点", "∅ 与 {0} 的区别\n∈ 与 ⊆ 的混用", C.ROSE),
    ("💡", "多维原理", "交换律: A∪B = B∪A\n德摩根律: ∁(A∩B)", RGBColor(0x8B, 0x5C, 0xF6)),
    ("🧪", "经典例题", "例: A={1,2}, B={1,3}\n求A∪B = {1,2,3}", C.GREEN),
    ("🔗", "知识关联", "集合 → 不等式解集\n集合 → 函数定义域", C.ACCENT3),
    ("🕸", "思维挑战", "集合中元素个数\n容斥原理: |A∪B|", C.AMBER),
]

for i, (icon, label, desc, color) in enumerate(dims):
    col = i % 4
    row = i // 4
    x = Inches(0.75 + col * 1.75)
    y = Inches(1.65 + row * 1.7)
    add_shape(slide, x, y, Inches(1.6), Inches(1.55))
    add_textbox(slide, x + Inches(0.05), Inches(1.72), Inches(0.4), Inches(0.3),
                icon, font_size=18)
    add_textbox(slide, x + Inches(0.45), Inches(1.72), Inches(1.1), Inches(0.25),
                label, font_size=12, color=color, bold=True)
    add_multiline_textbox(slide, x + Inches(0.05), Inches(2.08), Inches(1.4), Inches(1.0),
                desc, font_size=9, color=C.TEXT, line_spacing=1.5)

# Sidebar preview
add_shape(slide, Inches(7.9), Inches(1.65), Inches(4.6), Inches(3.4))
add_textbox(slide, Inches(8.1), Inches(1.8), Inches(4.2), Inches(0.3),
            "📐 课本目录树", font_size=14, color=C.ACCENT, bold=True)
add_multiline_textbox(slide, Inches(8.1), Inches(2.2), Inches(4.2), Inches(2.7),
    "▼ 📖 第一册\n"
    "  ▼ 第一章 集合与常用逻辑用语\n"
    "    📖 01-01 集合的概念         ←已选\n"
    "    📖 01-02 集合间的基本关系\n"
    "        01-03 集合的基本运算    ←灰色\n\n"
    "点击节编号 → 7 维网格\n"
    "点击维度方格 → 全宽详情页\n"
    "  → Markdown + KaTeX 公式\n"
    "  → 上/下节导航按钮\n\n"
    "示例: 01-01「核心概念」\n"
    "→ 集合三特征 + ∈/∉ 符号 + 常用数集",
    font_size=10, color=C.TEXT, line_spacing=1.6)

# ===================================================================
# SLIDE 7 — Review Mode Flow
# ===================================================================
slide = add_slide()
section_header(slide, "FEATURE")
page_title(slide, "复习模式 — 完整流程")

steps = [
    ("选题页", "7 维网格\n绿=✅ 已掌握\n红=❌ 未通过\n灰=待复习"),
    ("40s 预览", "显示题目+答案\n进度条倒计时\n记忆黄金期"),
    ("进入测试", "Cloze: 填空输入\nChoice: 点击选择"),
    ("即时评分", "全对 = 3 分\n有错 = 0 分\nSM-2 更新"),
    ("自动流转", "→ 下一维度\n→ 下一张卡片\n→ 复习完成"),
]

for i, (label, desc) in enumerate(steps):
    x = Inches(0.75 + i * 2.4)
    add_shape(slide, x, Inches(1.65), Inches(2.2), Inches(2.5))
    # Step number
    num_shape = slide.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.05), Inches(1.75), Inches(0.35), Inches(0.35))
    num_shape.fill.solid(); num_shape.fill.fore_color.rgb = RGBColor(0x2A, 0x15, 0x4A)
    num_shape.line.color.rgb = C.ACCENT; num_shape.line.width = Pt(1)
    add_textbox(slide, x + Inches(0.05), Inches(1.78), Inches(0.35), Inches(0.3),
                str(i+1), font_size=12, color=C.BRIGHT, bold=True, align=PP_ALIGN.CENTER)
    add_textbox(slide, x + Inches(0.5), Inches(1.78), Inches(1.5), Inches(0.25),
                label, font_size=13, color=C.ACCENT, bold=True)
    add_multiline_textbox(slide, x + Inches(0.1), Inches(2.2), Inches(1.9), Inches(1.8),
                desc, font_size=10, color=C.TEXT, line_spacing=1.6)

# Bottom cards
add_shape(slide, Inches(0.75), Inches(4.5), Inches(5.8), Inches(2.5))
add_textbox(slide, Inches(1.0), Inches(4.65), Inches(5.0), Inches(0.3),
            "安全限制", font_size=13, color=C.ROSE, bold=True)
add_multiline_textbox(slide, Inches(1.0), Inches(5.0), Inches(5.0), Inches(1.8),
    "测试阶段强制禁用:\n"
    "  • Ctrl+V / Cmd+V — 禁止粘贴\n"
    "  • Ctrl+C / Cmd+C — 禁止复制\n"
    "  • 右键菜单 — 禁止 contextmenu\n\n"
    "手写草稿板 (Canvas): Apple Pencil 手写演算，切换题目自动清空",
    font_size=11, color=C.TEXT, line_spacing=1.6)

add_shape(slide, Inches(6.9), Inches(4.5), Inches(5.8), Inches(2.5))
add_textbox(slide, Inches(7.15), Inches(4.65), Inches(5.0), Inches(0.3),
            "全维度完成后", font_size=13, color=C.GREEN, bold=True)
add_multiline_textbox(slide, Inches(7.15), Inches(5.0), Inches(5.0), Inches(1.8),
    "一张卡片 7 维全部通过:\n"
    "  • 显示「下一张 →」按钮\n"
    "  • 自动加载下一张待复习卡片\n\n"
    "全部卡片复习完毕:\n"
    "  🎉 今日复习完成！没有待复习的卡片\n\n"
    "统计: 正确数/总数 + 正确率",
    font_size=11, color=C.TEXT, line_spacing=1.6)

# ===================================================================
# SLIDE 8 — Quiz Examples
# ===================================================================
slide = add_slide()
section_header(slide, "EXAMPLES")
page_title(slide, "题型示例 — Cloze vs Choice")

# Cloze
add_shape(slide, Inches(0.75), Inches(1.65), Inches(5.8), Inches(3.5))
badge_c = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.9), Inches(1.8), Inches(1.0), Inches(0.28))
badge_c.fill.solid(); badge_c.fill.fore_color.rgb = RGBColor(0x2A, 0x15, 0x4A)
badge_c.line.color.rgb = C.ACCENT; badge_c.line.width = Pt(1); badge_c.adjustments[0] = 0.5
add_textbox(slide, Inches(0.9), Inches(1.82), Inches(1.0), Inches(0.25),
            "✏️ 填空 (Cloze)", font_size=9, color=C.ACCENT, bold=True, align=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0.9), Inches(2.2), Inches(5.0), Inches(0.4),
            "题: 集合的三个基本特征是 ____、____、____。", font_size=13, color=C.BRIGHT)
add_multiline_textbox(slide, Inches(0.9), Inches(2.7), Inches(5.0), Inches(0.8),
    "✓ 答: 确定性、互异性、无序性\n用户输入后 NFKC 归一化: A (U+0041) ≡ Ａ (U+FF21)",
    font_size=11, color=C.GREEN, line_spacing=1.5)
add_multiline_textbox(slide, Inches(0.9), Inches(3.5), Inches(5.0), Inches(1.3),
    "评分: 全部填空正确 → 3 分\n"
    "      任意填空错误 → 0 分（显示正确答案）\n"
    "答案格式: answer: [\"确定性\", \"互异性\", \"无序性\"]",
    font_size=10, color=C.DIM, line_spacing=1.5)

# Choice
add_shape(slide, Inches(6.9), Inches(1.65), Inches(5.8), Inches(3.5))
badge_s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.05), Inches(1.8), Inches(1.0), Inches(0.28))
badge_s.fill.solid(); badge_s.fill.fore_color.rgb = RGBColor(0x0A, 0x2A, 0x50)
badge_s.line.color.rgb = C.ACCENT2; badge_s.line.width = Pt(1); badge_s.adjustments[0] = 0.5
add_textbox(slide, Inches(7.05), Inches(1.82), Inches(1.0), Inches(0.25),
            "🔘 选择 (Choice)", font_size=9, color=C.ACCENT2, bold=True, align=PP_ALIGN.CENTER)
add_textbox(slide, Inches(7.05), Inches(2.2), Inches(5.0), Inches(0.3),
            "题: 下列关系式中正确的是？", font_size=13, color=C.BRIGHT)
add_multiline_textbox(slide, Inches(7.05), Inches(2.6), Inches(5.0), Inches(1.2),
    "A. 0 ∈ ∅\n"
    "B. ∅ ⊆ {0}          ← 正确答案\n"
    "C. 0 = ∅\n"
    "D. {∅} = ∅",
    font_size=11, color=C.TEXT, line_spacing=1.6)
add_multiline_textbox(slide, Inches(7.05), Inches(3.8), Inches(5.0), Inches(1.2),
    "评分: 选 B → 3 分 (绿色标注)\n"
    "      选 A/C/D → 0 分 (红色标注，正确项标绿)\n"
    "选项顺序: Fisher-Yates 随机打乱，每次不同",
    font_size=10, color=C.DIM, line_spacing=1.5)

# Bottom bar
add_shape(slide, Inches(0.75), Inches(5.4), Inches(11.95), Inches(1.0))
add_textbox(slide, Inches(1.0), Inches(5.55), Inches(4), Inches(0.25),
            "题型设计原则", font_size=12, color=C.ACCENT, bold=True)
add_multiline_textbox(slide, Inches(1.0), Inches(5.85), Inches(11.4), Inches(0.5),
    "Cloze 测试精确回忆（回顾+生成）→ 高认知负荷，加深记忆。Choice 测试识别判断（匹配+区分）→ 低认知负荷，快速验证。两者互补，覆盖完整记忆曲线。",
    font_size=10, color=C.TEXT, line_spacing=1.5)

# ===================================================================
# SLIDE 9 — Handwriting + Bank
# ===================================================================
slide = add_slide()
section_header(slide, "FEATURE")
page_title(slide, "手写识别 + 题库管理")

add_shape(slide, Inches(0.75), Inches(1.65), Inches(5.8), Inches(3.0))
add_textbox(slide, Inches(1.0), Inches(1.8), Inches(5.0), Inches(0.3),
            "🖊️ 手写符号识别 (Detexify)", font_size=14, color=C.ACCENT3, bold=True)
add_multiline_textbox(slide, Inches(1.0), Inches(2.2), Inches(5.0), Inches(2.3),
    "Canvas 手写板 → DTW + k-NN 分类\n\n"
    "预处理流水线:\n"
    "  去重 → 平滑 → 重采样(32点) → 归一化 → 主方向对齐\n\n"
    "分类: 动态时间规整 (DTW) 距离\n"
    "  取 2 个最近样本均值 → top-5 候选\n"
    "  置信度 = 1 / (1 + meanDistance)\n\n"
    "训练数据: 200+ 常用 LaTeX 符号\n"
    "  支持 ∈, ⊆, ∪, ∩, ∀, ∃, ∑, ∏, ∂, ∇ 等",
    font_size=10, color=C.TEXT, line_spacing=1.5)

add_shape(slide, Inches(6.9), Inches(1.65), Inches(5.8), Inches(3.0))
add_textbox(slide, Inches(7.15), Inches(1.8), Inches(5.0), Inches(0.3),
            "📊 题库模式 (BankMode)", font_size=14, color=C.GREEN, bold=True)
add_multiline_textbox(slide, Inches(7.15), Inches(2.2), Inches(5.0), Inches(2.3),
    "三张统计卡片:\n"
    "  • 总卡片数 — 题库全部卡片\n"
    "  • 待复习 — 今日到期数量\n"
    "  • 已掌握 — 未到期数量\n\n"
    "SRS 状态表格:\n"
    "  ID / 标题 / 分类 / 复习次数\n"
    "  当前间隔 / 难度因子 / 到期日 / 状态\n\n"
    "状态指示:\n"
    "  🟤 新卡片 — 从未复习\n"
    "  🟡 待复习 — 今日到期\n"
    "  🟢 已掌握 — 未到期",
    font_size=10, color=C.TEXT, line_spacing=1.5)

# Bottom
add_shape(slide, Inches(0.75), Inches(4.9), Inches(11.95), Inches(1.3))
add_textbox(slide, Inches(1.0), Inches(5.05), Inches(5), Inches(0.25),
            "📐 数学符号面板 (MathSymbolPad)", font_size=12, color=C.AMBER, bold=True)
add_multiline_textbox(slide, Inches(1.0), Inches(5.35), Inches(11.4), Inches(0.6),
    "6 组符号: 集合 (∈, ⊆, ∪) · 逻辑 (∀, ∃, ∧) · 运算 (±, ×, √) · 比较 (≤, ≥, ≠) · 希腊 (α, β, π) · 角标 (₁, ₂, ³)\n"
    "点击插入填空输入框，Apple Pencil 友好。Canvas 手写草稿板辅助演算。",
    font_size=10, color=C.TEXT, line_spacing=1.5)

# ===================================================================
# SLIDE 10 — Data Management + Deployment
# ===================================================================
slide = add_slide()
section_header(slide, "OPERATIONS")
page_title(slide, "数据管理 + 部署运维")

add_shape(slide, Inches(0.75), Inches(1.65), Inches(5.8), Inches(2.5))
add_textbox(slide, Inches(1.0), Inches(1.8), Inches(5.0), Inches(0.3),
            "📦 导入 / 导出", font_size=14, color=C.ACCENT, bold=True)
add_multiline_textbox(slide, Inches(1.0), Inches(2.2), Inches(5.0), Inches(1.8),
    "导入:\n"
    "  • 粘贴 JSON → INSERT OR REPLACE\n"
    "  • 同 ID 覆盖，旧 SRS 状态清除\n"
    "  • 新卡片标记 source=\"imported\"\n\n"
    "导出 (4 种格式):\n"
    "  📄 全部卡片 (JSON) — 数据迁移\n"
    "  📊 复习进度 (JSON) — srs + log\n"
    "  📈 复习统计 (CSV) — Excel 可打开\n"
    "  🗜️ 完整备份 (ZIP) — 三合一",
    font_size=10, color=C.TEXT, line_spacing=1.5)

add_shape(slide, Inches(6.9), Inches(1.65), Inches(5.8), Inches(2.5))
add_textbox(slide, Inches(7.15), Inches(1.8), Inches(5.0), Inches(0.3),
            "🚀 一键部署", font_size=14, color=C.ACCENT2, bold=True)
add_multiline_textbox(slide, Inches(7.15), Inches(2.2), Inches(5.0), Inches(1.8),
    "启动命令:\n"
    "  $ env PYTHONPATH=. \\\n"
    "    .venv/bin/uvicorn server.main:app \\\n"
    "    --host 0.0.0.0 --port 3000\n\n"
    "三部曲:\n"
    "  ① python3 -m venv .venv\n"
    "  ② pip install -r requirements.txt\n"
    "  ③ npm install && npm run build\n\n"
    "数据重置:\n"
    "  rm data/cards.db* → 重启自动 seed",
    font_size=10, color=C.TEXT, line_spacing=1.5)

add_shape(slide, Inches(0.75), Inches(4.4), Inches(11.95), Inches(1.5))
add_textbox(slide, Inches(1.0), Inches(4.55), Inches(5), Inches(0.25),
            "🌐 局域网访问 + 离线保障", font_size=12, color=C.AMBER, bold=True)
add_multiline_textbox(slide, Inches(1.0), Inches(4.85), Inches(11.4), Inches(0.8),
    "Mac 查看 IP: ipconfig getifaddr en0 → 例如 192.168.1.5\n"
    "iPad Safari 访问: http://192.168.1.5:3000 → 添加到主屏幕（类 App 体验）\n"
    "离线检测: 15s 健康检查轮询，离线时黄色横幅提示「仅浏览模式可用」\n"
    "SPA fallback: 刷新任意路径不白屏",
    font_size=10, color=C.TEXT, line_spacing=1.5)

# ===================================================================
# SLIDE 11 — Summary
# ===================================================================
slide = add_slide()
# Gradient overlay
add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, RGBColor(0x1A, 0x05, 0x33))
add_rect(slide, Inches(3), 0, SLIDE_W, SLIDE_H, RGBColor(0x0A, 0x16, 0x28))

add_rect(slide, Inches(0.75), Inches(1.3), Inches(0.8), Pt(4), C.ACCENT)
add_textbox(slide, Inches(0.75), Inches(1.55), Inches(8), Inches(0.7),
            "项目亮点", font_size=38, color=C.BRIGHT, bold=True)

highlights = [
    "🧠  科学记忆 — SM-2 算法 + 7 维认知模型，覆盖完整学习曲线",
    "📖  双源独立 — 浏览笔记与复习题库分离，学习与巩固各司其职",
    "🎯  精准测试 — Cloze 精确回忆 + Choice 识别判断，两种题型互补",
    "📐  数学优先 — KaTeX 渲染 + Detexify 手写符号识别 + 符号面板",
    "🌐  零配置部署 — 3 条命令启动，局域网多端访问，SPA fallback",
    "🔒  本地运行 — SQLite WAL 存储，数据不上传，完全隐私安全",
    "🖊️  Apple Pencil — Canvas 手写草稿 + 符号识别，Pad 原生体验",
    "📊  数据可控 — 4 种导出格式，JSON/CSV/ZIP 自由迁移备份",
]
for i, h in enumerate(highlights):
    add_textbox(slide, Inches(0.75), Inches(2.5 + i * 0.45), Inches(10), Inches(0.4),
                h, font_size=16, color=C.TEXT, line_spacing=1.5)

# Tech recap
add_shape(slide, Inches(0.75), Inches(6.3), Inches(11.95), Inches(0.55))
add_textbox(slide, Inches(1.0), Inches(6.38), Inches(11.4), Inches(0.4),
            "React 19  ·  TypeScript 6  ·  Vite 8  ·  FastAPI  ·  SQLite WAL  ·  KaTeX  ·  Tailwind CSS 4  ·  Lucide  ·  pytest  ·  vitest",
            font_size=10, color=C.DIM, align=PP_ALIGN.CENTER)

# ===================================================================
# Save
# ===================================================================
output_path = os.environ.get('FINAL_PPTX', 'math-srs-presentation.pptx')
os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
prs.save(output_path)
print(f"✅ Deck saved to {output_path}")
print(f"✅ {len(prs.slides)} slides")
