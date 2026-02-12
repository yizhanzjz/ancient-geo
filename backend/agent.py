"""
LangGraph agent for ancient Chinese place name lookup.
Flow: parse_input -> llm_lookup -> extract_coordinates -> format_output

Uses ZhipuAI SDK for reliable GLM API access.
Includes a fallback knowledge base for common ancient place names.
"""

import json
import os
import re
from pathlib import Path
from typing import TypedDict, Optional

from dotenv import load_dotenv
from langgraph.graph import StateGraph, END

load_dotenv()

# Load fallback data from JSON file
_fallback_path = Path(__file__).parent / "fallback_data.json"
with open(_fallback_path, "r", encoding="utf-8") as _f:
    FALLBACK_DATA = json.load(_f)

SYSTEM_PROMPT = (
    "你是一位专业的中国历史地理学家。"
    "用户给你一个中国古代地名，你需要返回对应的现代位置信息。\n\n"
    "请仅返回有效的 JSON（不要 markdown、不要多余文字），格式如下：\n"
    "{\n"
    '    "modern_name": "现代城市/地区名称",\n'
    '    "province": "省份名称",\n'
    '    "latitude": 纬度数值,\n'
    '    "longitude": 经度数值,\n'
    '    "description": "该地的历史地理说明",\n'
    '    "dynasty_info": "相关朝代信息"\n'
    "}\n\n"
    "规则：\n"
    "1. 经纬度必须是准确的数值（中国范围：纬度 18-54，经度 73-135）\n"
    "2. 对于知名古都，请给出精确坐标\n"
    "3. 描述要简洁但信息丰富，使用中文\n"
    "4. 所有文本值使用中文\n"
    "5. 如果无法识别该古代地名，请在 modern_name 中说明"
)


def _call_glm(ancient_name: str) -> str:
    """Call GLM via ZhipuAI SDK. Clears proxy env vars to avoid issues."""
    # Save and clear proxy env vars
    proxy_vars = {}
    for var in ["http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "all_proxy"]:
        if var in os.environ:
            proxy_vars[var] = os.environ.pop(var)

    try:
        from zhipuai import ZhipuAI
        client = ZhipuAI(api_key=os.getenv("GLM_API_KEY"))
        response = client.chat.completions.create(
            model=os.getenv("GLM_MODEL", "glm-4-flash"),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"古代地名：{ancient_name}"},
            ],
            temperature=0.1,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    finally:
        os.environ.update(proxy_vars)


class AgentState(TypedDict):
    """State passed between graph nodes."""
    ancient_name: str
    raw_llm_response: Optional[str]
    modern_name: Optional[str]
    province: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    description: Optional[str]
    dynasty_info: Optional[str]
    error: Optional[str]
    used_fallback: Optional[bool]


def parse_input(state: AgentState) -> AgentState:
    """Validate and clean the input ancient place name."""
    name = state.get("ancient_name", "").strip()
    if not name:
        return {**state, "error": "请输入一个古代地名"}
    return {**state, "ancient_name": name}


def _lookup_fallback(ancient_name: str) -> Optional[dict]:
    """Try to find the place name in fallback data. Returns dict or None."""
    # Exact match
    if ancient_name in FALLBACK_DATA:
        return FALLBACK_DATA[ancient_name]
    # Partial match
    for key, val in FALLBACK_DATA.items():
        if key in ancient_name or ancient_name in key:
            return val
    # Check runtime cache
    if ancient_name in _runtime_cache:
        return _runtime_cache[ancient_name]
    return None


# Runtime cache: LLM results cached in memory to avoid repeated calls
_runtime_cache: dict[str, dict] = {}


def llm_lookup(state: AgentState) -> AgentState:
    """Look up the ancient place name.
    Priority: fallback data (instant) -> LLM (slow, cached after first call)."""
    if state.get("error"):
        return state

    ancient_name = state["ancient_name"]

    # 1. Try fallback data first (instant)
    fallback = _lookup_fallback(ancient_name)
    if fallback:
        return {
            **state,
            "raw_llm_response": json.dumps(fallback, ensure_ascii=False),
            "used_fallback": True,
        }

    # 2. Call LLM (slow path)
    try:
        raw = _call_glm(ancient_name)
        # Cache the parsed result for future lookups
        try:
            json_match = re.search(r'\{[\s\S]*\}', raw)
            if json_match:
                parsed = json.loads(json_match.group())
                _runtime_cache[ancient_name] = parsed
        except Exception:
            pass
        return {**state, "raw_llm_response": raw, "used_fallback": False}
    except Exception as e:
        print(f"[WARN] LLM call failed: {e}")
        return {**state, "error": f"大模型暂不可用，且没有「{ancient_name}」的内置数据"}


def extract_coordinates(state: AgentState) -> AgentState:
    """Parse the LLM response and validate coordinates."""
    if state.get("error"):
        return state

    raw = state.get("raw_llm_response", "")
    if not raw:
        return {**state, "error": "大模型返回了空响应"}

    try:
        # Extract JSON from the response (handle markdown code blocks)
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if not json_match:
            return {**state, "error": "无法从大模型响应中解析 JSON"}

        data = json.loads(json_match.group())

        lat = float(data.get("latitude", 0))
        lng = float(data.get("longitude", 0))

        # Validate coordinates are within China's approximate bounds
        if not (18 <= lat <= 54 and 73 <= lng <= 135):
            desc = data.get("description", "")
            desc += "（注意：经纬度可能不够准确，仅供参考）"
            data["description"] = desc
            if lat == 0 or lng == 0 or lat < -90 or lat > 90 or lng < -180 or lng > 180:
                lat = 35.86
                lng = 104.20

        return {
            **state,
            "modern_name": data.get("modern_name", "未知"),
            "province": data.get("province", "未知"),
            "latitude": lat,
            "longitude": lng,
            "description": data.get("description", "暂无说明"),
            "dynasty_info": data.get("dynasty_info", "暂无朝代信息"),
        }
    except (json.JSONDecodeError, ValueError) as e:
        return {**state, "error": f"解析大模型响应失败: {e}"}


def format_output(state: AgentState) -> AgentState:
    """Final formatting and cleanup."""
    return state


def build_graph():
    """Build and compile the LangGraph agent."""
    graph = StateGraph(AgentState)

    graph.add_node("parse_input", parse_input)
    graph.add_node("llm_lookup", llm_lookup)
    graph.add_node("extract_coordinates", extract_coordinates)
    graph.add_node("format_output", format_output)

    graph.set_entry_point("parse_input")
    graph.add_edge("parse_input", "llm_lookup")
    graph.add_edge("llm_lookup", "extract_coordinates")
    graph.add_edge("extract_coordinates", "format_output")
    graph.add_edge("format_output", END)

    return graph.compile()


# Pre-compile the graph
agent = build_graph()


async def query_ancient_place(ancient_name: str) -> dict:
    """Main entry point: query an ancient place name and return structured result."""
    initial_state: AgentState = {
        "ancient_name": ancient_name,
        "raw_llm_response": None,
        "modern_name": None,
        "province": None,
        "latitude": None,
        "longitude": None,
        "description": None,
        "dynasty_info": None,
        "error": None,
        "used_fallback": None,
    }

    result = agent.invoke(initial_state)

    if result.get("error"):
        raise ValueError(result["error"])

    return {
        "ancient_name": result["ancient_name"],
        "modern_name": result["modern_name"],
        "province": result["province"],
        "latitude": result["latitude"],
        "longitude": result["longitude"],
        "description": result["description"],
        "dynasty_info": result["dynasty_info"],
    }
