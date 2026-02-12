# 🏛️ 古今地名对照 (Ancient Geo)

输入中国古代地名，查看对应的现代地理位置并在地图上标注。

基于 LangGraph + 智谱 GLM 智能体，自动解析古代地名并返回现代位置、经纬度、历史说明等结构化信息。

## 技术栈

- **后端**: Python + FastAPI + LangGraph + ZhipuAI SDK
- **前端**: Next.js + React + TypeScript + Tailwind CSS + Leaflet (OpenStreetMap)
- **大模型**: 智谱 GLM-4-Flash（免费）

## 本地运行

### 后端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的智谱 API Key

# 启动
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd frontend
npm install

# 配置 API 地址（默认 http://localhost:8000）
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 启动
npm run dev
```

访问 http://localhost:3000

## API

### POST /api/query

请求：
```json
{ "ancient_name": "长安" }
```

响应：
```json
{
  "ancient_name": "长安",
  "modern_name": "西安市",
  "province": "陕西省",
  "latitude": 34.26,
  "longitude": 108.94,
  "description": "长安是中国历史上最重要的古都之一...",
  "dynasty_info": "西周、秦、西汉、隋、唐等朝代都城"
}
```

### GET /api/health

健康检查，返回 `{"status": "ok"}`

## 部署

- **后端**: Render (Dockerfile 已配置)
- **前端**: Vercel (`npm run build` 即可)

## 许可

MIT
