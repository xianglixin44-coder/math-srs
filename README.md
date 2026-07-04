# 数学SRS系统

高中数学间隔重复记忆系统 — FastAPI + React + TypeScript + SQLite

## 启动命令

```bash
# 0. 进入项目
cd ~/Documents/math-srs

# 1. 安装前端依赖（首次或 package.json 变更后）
npm install

# 2. 构建前端到 dist/
npm run build

# 3. 激活虚拟环境并启动后端（端口 3000）
source .venv/bin/activate
python -m uvicorn server.main:app --host 0.0.0.0 --port 3000

# 4. 浏览器访问
open http://localhost:3000
```

## 一键启动

```bash
cd ~/Documents/math-srs && npx vite build && source .venv/bin/activate && python -m uvicorn server.main:app --host 0.0.0.0 --port 3000
```

## 开发模式

```bash
# 前端热更新（端口 5173）
npm run dev

# 后端热重载
source .venv/bin/activate
python -m uvicorn server.main:app --host 0.0.0.0 --port 3000 --reload
```

## 生成配图

```bash
# matplotlib 需使用系统 Python（非 venv）
PYTHONPATH=~/Library/Python/3.9/lib/python/site-packages /usr/bin/python3 /tmp/gen_xxx.py
```

## 测试

```bash
npm test        # 前端测试（vitest）
npm run build   # 构建验证
```

## 局域网共享

```
Mac:  http://localhost:3000
iPad: http://192.168.x.x:3000  （替换为 Mac IP）
```
