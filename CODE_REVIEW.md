# 代码审查报告 — math-srs

**审查日期**: 2026-07-11
**审查范围**: 前端 (src/) + 后端 (server/) + 配置文件
**工具**: tsc --noEmit, eslint, vitest, 人工审查

---

## 概览

| 类别 | 数量 |
|------|------|
| 🔴 严重（构建失败/安全漏洞） | 3 |
| 🟠 重要（逻辑缺陷） | 3 |
| 🟡 中等（代码质量） | 7 |
| 🟢 轻微（优化建议） | 4 |

**测试状态**: vitest 16/16 通过, 后端 pytest 未运行（需 venv）
**构建状态**: ❌ `tsc -b` 失败（4 个类型错误）

---

## 🔴 严重问题

### 1. Layout.tsx 的 Mode 类型缺少 'exercises'

**文件**: `src/components/Layout.tsx:5`
**影响**: TypeScript 编译失败，`npm run build` 报错

```typescript
// Layout.tsx — 缺少 'exercises'
type Mode = 'browse' | 'review' | 'import' | 'bank' | 'books' | 'lectures';

// App.tsx — 包含 'exercises'
type Mode = 'browse' | 'review' | 'import' | 'bank' | 'books' | 'lectures' | 'exercises';
```

`App.tsx` 将 `setMode` 传给 `Layout`，但两者的 `Mode` 类型定义不一致。`Layout` 内部的 `toolNav` 数组实际包含了 `{ key: 'exercises', ... }`，与其自身类型声明矛盾。

**修复**: 在 `Layout.tsx` 的 `Mode` 类型中加入 `'exercises'`。

---

### 2. LecturesMode.tsx 中 `sec` 可能为 undefined

**文件**: `src/components/LecturesMode.tsx:103-105`
**影响**: TypeScript 编译失败

```typescript
const summarySections = p2 ? p2.sections : [essenceSec, connectionSec].filter(Boolean);
//                                                            ↑ filter(Boolean) 无法收窄类型
// ...
{summarySections.map(sec => (
  <div key={sec.key}>          // ← sec 可能是 undefined
    <h4>{sec.label}</h4>       // ← sec 可能是 undefined
    {renderMarkdown(sec.content)} // ← sec 可能是 undefined
  </div>
))}
```

TypeScript 的 `.filter(Boolean)` 不会收窄联合类型中的 `undefined`。

**修复**: 使用类型断言或自定义类型守卫：
```typescript
const summarySections: LectureSection[] = p2
  ? p2.sections
  : [essenceSec, connectionSec].filter((s): s is LectureSection => s !== undefined);
```

---

### 3. 教材路由存在路径穿越漏洞

**文件**: `server/routers/books.py:31-47`
**影响**: 🔒 安全漏洞 — 可读取/删除任意文件

```python
@router.get("/{filename}")
def read_book(filename: str):
    path = BOOKS_DIR / filename   # ← filename 可包含 ../
    if not path.exists():
        raise HTTPException(404, "教材不存在")
    return FileResponse(path, media_type="application/pdf")

@router.delete("/{filename}")
def delete_book(filename: str):
    path = BOOKS_DIR / filename   # ← 同上
    ...
    path.unlink()
```

攻击者可构造 `GET /api/books/../../etc/passwd` 读取系统文件，或 `DELETE /api/books/../../../important_file` 删除文件。

**修复**: 验证解析后的路径在 `BOOKS_DIR` 内：
```python
path = (BOOKS_DIR / filename).resolve()
if not path.is_relative_to(BOOKS_DIR.resolve()):
    raise HTTPException(400, "非法路径")
```

---

## 🟠 重要问题

### 4. SM-2 多维度复习导致算法叠加

**文件**: `server/database.py:90-130`, `server/routers/srs.py:23-54`
**影响**: 复习间隔计算不准确

当前设计：一张卡片有多个维度（formula, derive, trigger...），用户逐个维度评分。但每次 `POST /api/srs/review` 都会触发完整的 `sm2_update`，更新卡片级别的 `ease_factor`、`interval`、`due_date`。

**问题**：如果一张卡片有 7 个维度，用户全部复习后，SM-2 算法被调用了 7 次，ease_factor 累加 7 次（2.5 → 3.2），interval 被最后一次评分覆盖。卡片的到期日由最后一个维度决定，而非整体表现。

```python
# sm2_update 每次都更新整张卡片的 SRS 状态
ef = max(1.3, ef + 0.1)  # 每答对一次 +0.1
```

**建议**: 在所有维度复习完成后才调用一次 `sm2_update`（用整体评分），或改为维度级别的 SRS（每维度独立跟踪 due_date）。

---

### 5. 评分校验前后端不一致

**文件**: `server/models.py:40` vs `server/database.py:96`

```python
# models.py — 允许 0-3
class ReviewRequest(BaseModel):
    score: int = Field(ge=0, le=3)

# database.py — 只允许 0 或 3
if score not in (0, 3):
    raise ValueError(f"Score must be 0 or 3, got {score}")
```

前端只发送 0（错）或 3（对），所以当前不会触发。但 API 契约说允许 1、2，实际会返回 400。如果未来加入"部分正确"评分会踩坑。

**修复**: 统一校验逻辑——要么 API 只允许 0/3（`Field(ge=0, le=3)` → 自定义验证器），要么 sm2_update 支持中间分值。

---

### 6. BrowseMode 内联图片渲染丢失文字

**文件**: `src/components/BrowseMode.tsx:135-147`

```typescript
if (line.includes('![') && line.includes('](')) {
  const parts = line.split(/(!\[.*?\]\(.+?\))/g);
  result.push(
    <div key={i} className="my-4 flex justify-center">
      {parts.map((part, pi) => {
        const im = part.match(/!\[(.*)\]\((.+)\)/);
        if (im) return <img ... />;
        return null;  // ← 文本部分被丢弃！
      })}
    </div>
  );
}
```

当一行同时包含文字和图片时（如 `参见下图 ![](img.png)`），非图片文本返回 `null` 被丢弃。

**修复**: 将文本部分渲染为 `<span>`：
```typescript
if (im) return <img ... />;
return <span key={pi}>{part}</span>;
```

---

## 🟡 中等问题

### 7. useEffect 中同步调用 setState

**文件**: `src/App.tsx:27-29`

```typescript
useEffect(() => {
  if (mode === 'lectures') setLectureKey(k => k + 1);
}, [mode]);
```

ESLint 报错 `react-hooks/set-state-in-effect`。在 effect 中同步 setState 会触发级联渲染。

**修复**: 将 `lectureKey` 递增逻辑移到 `handleLectureClick` 中（已有），删除这个 useEffect。或者在 `LecturesMode` 内部用 `key` prop 配合路由逻辑处理。

---

### 8. 复习 API 调用未处理错误

**文件**: `src/components/ReviewMode.tsx:153`

```typescript
api.srs.review(card.id, view.dim.key, score);  // ← 无 await, 无 .catch()
```

如果网络失败，产生未处理的 Promise 拒绝。UI 会继续流转但 SRS 状态未更新，用户不知道复习没保存。

**修复**: 添加 `.catch()` 或 `await` + try/catch + 用户提示。

---

### 9. Sidebar.tsx 使用 any 类型

**文件**: `src/components/Sidebar.tsx:45`

```typescript
api.browse.list().then((cards: any[]) => {  // ← any
```

**修复**: 使用已定义的 `BrowseCardSummary` 类型。

---

### 10. LecturesMode 空 catch 块

**文件**: `src/components/LecturesMode.tsx:126`

```typescript
try { const r = await fetch(...); if (r.ok) setSelected(await r.json()); } catch {}
```

**修复**: 至少加 `console.error` 或设置错误状态。

---

### 11. markdown.tsx 违反 Fast Refresh 规则

**文件**: `src/utils/markdown.tsx`

文件同时导出组件（`LatexText`, `InlineLine`）和函数（`renderMarkdown`），导致 Fast Refresh 失效。开发时修改此文件不会热更新。

**修复**: 将 `renderMarkdown` 移到单独文件，或将组件移出。

---

### 12. exercises.py 缺少 JSON 解析错误处理

**文件**: `server/routers/exercises.py:11-21`

```python
for f in sorted(LECTURES_DIR.glob("*.json")):
    d = json.loads(f.read_text())  # ← 无 try/except，损坏文件会 500
    for part in d.get("parts", []):
        ...
```

对比 `lectures.py` 和 `browse.py` 都有 `try/except (json.JSONDecodeError, KeyError): continue`。

**修复**: 添加与其他路由一致的 try/except。

---

### 13. symbols.py 训练接口缺少输入验证且有竞态条件

**文件**: `server/routers/symbols.py:30-48`

```python
body = await req.json()
symbol = body["symbol"]    # ← KeyError 如果字段缺失
strokes = body["strokes"]  # ← 同上
```

且读写 `TRAINING_FILE` 无文件锁，并发训练请求可能丢失数据。

**修复**: 用 `body.get()` + 验证；写文件时加锁或使用临时文件 + 原子替换。

---

## 🟢 轻微问题

### 14. 健康检查每 15 秒加载全部卡片

**文件**: `src/api/client.ts:14-21`

`checkHealth()` 调用 `GET /api/cards` 加载所有卡片数据来检测后端是否在线，每 15 秒一次。

**建议**: 添加轻量级 `GET /api/health` 端点，返回 `{ "ok": true }`。

---

### 15. browse.py 会尝试解析 textbook.json

**文件**: `server/routers/browse.py:27`

`BROWSE_DIR.glob("*.json")` 会匹配 `textbook.json`，虽然 `except` 会跳过它，但属于无效操作。

**建议**: 排除 `textbook.json`，或将教材目录放在别处。

---

### 16. `all_dimensions_pass` 变量名有误导性

**文件**: `server/routers/srs.py:51`

```python
all_pass = all(v == 3 for v in dim_scores.values())
```

`dim_scores` 只包含已复习过的维度。如果卡片有 7 个维度但只复习了 3 个且全对，`all_pass` 为 `True`，但并非"所有维度"都通过。

**建议**: 重命名为 `reviewed_dims_all_pass`，或与卡片的实际维度列表对比。

---

### 17. `_verify.cjs` 导致 ESLint 解析错误

**文件**: `_verify.cjs`

ESLint 尝试将其作为模块解析但失败。应在 eslint 配置中忽略，或删除该临时文件。

---

## 总结

代码整体结构清晰，前后端分离合理，测试覆盖了 SM-2 算法和 API 边界。主要问题集中在：

1. **类型定义不一致**（Mode 类型）导致构建失败——需立即修复
2. **路径穿越安全漏洞**——需立即修复
3. **SM-2 多维度复习的算法设计**需要重新考虑——影响核心功能正确性
4. 若干代码质量改进点——不影响运行但影响可维护性

建议优先修复 🔴 和 🟠 级别的问题。
