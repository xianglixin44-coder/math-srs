# 数学SRS系统

高中数学间隔重复记忆系统 — FastAPI + React + SQLite

## 启动命令

```bash
# 1. 安装依赖
cd ~/Documents/math-srs
npm install

# 2. 构建前端
npm run build

# 3. 启动后端 (端口 3000)
python3 -m uvicorn server.main:app --host 0.0.0.0 --port 3000

# 4. 浏览器访问
open http://localhost:3000
```

## 一键启动

```bash
cd ~/Documents/math-srs && npm run build && python3 -m uvicorn server.main:app --host 0.0.0.0 --port 3000
```

## 局域网共享 (Mac + iPad)

```
Mac:  http://localhost:3000
iPad: http://192.168.x.x:3000  (替换为 Mac 实际 IP)
```

查看 Mac IP: `ipconfig getifaddr en0`

## 开发模式

```bash
# 前端热更新 (端口 5173)
npm run dev

# 后端开发
python3 -m uvicorn server.main:app --host 0.0.0.0 --port 3000 --reload
```

## 测试

```bash
npm test        # 前端测试 (vitest)
npm run lint    # ESLint
```
