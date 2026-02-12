"""
FastAPI server for Ancient Place Name → Modern Location lookup.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import query_ancient_place

app = FastAPI(
    title="古代地名查询 API",
    description="输入中国古代地名，返回对应的现代位置信息",
    version="1.0.0",
)

# CORS - allow all origins for development, restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    ancient_name: str


class QueryResponse(BaseModel):
    ancient_name: str
    modern_name: str
    province: str
    latitude: float
    longitude: float
    description: str
    dynasty_info: str


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "ancient-geo-api"}


@app.post("/api/query", response_model=QueryResponse)
async def query_place(request: QueryRequest):
    """Query an ancient place name and return modern location info."""
    if not request.ancient_name.strip():
        raise HTTPException(status_code=400, detail="古代地名不能为空")

    try:
        result = await query_ancient_place(request.ancient_name.strip())
        return QueryResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
