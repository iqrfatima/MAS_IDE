import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent.orchestrator import orchestrator
from services.llm_service import GeminiQuotaError

router = APIRouter(
    prefix="/agents",
    tags=["agents"],
)


class AgentRequest(BaseModel):
    prompt: str
    gemini_api_key: Optional[str] = None
    agent_id: Optional[str] = "orchestrator"
    project_name: Optional[str] = None


def _validate_request(request: AgentRequest) -> None:
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    if not request.gemini_api_key and not _has_env_key():
        raise HTTPException(
            status_code=400,
            detail=(
                "Gemini API key is required. "
                "Provide gemini_api_key in the request body."
            ),
        )


@router.post("/run")
async def run_agents(request: AgentRequest):
    _validate_request(request)

    try:
        result = await orchestrator.run(
            request.prompt,
            gemini_api_key=request.gemini_api_key,
            agent_id=request.agent_id,
            project_name=request.project_name,
        )
    except GeminiQuotaError as exc:
        raise HTTPException(
            status_code=429,
            detail={
                "message": str(exc),
                "hint": (
                    "Quota exceeded. Wait a few minutes or "
                    "provide a different API key."
                ),
            },
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return result


@router.post("/run/stream")
async def run_agents_stream(request: AgentRequest):
    _validate_request(request)

    async def event_generator():
        try:
            async for event_type, data in orchestrator.run_stream(
                request.prompt,
                gemini_api_key=request.gemini_api_key,
                agent_id=request.agent_id,
                project_name=request.project_name,
            ):
                payload = json.dumps(data, default=str)
                yield f"event: {event_type}\ndata: {payload}\n\n"
        except GeminiQuotaError as exc:
            error_data = json.dumps({
                "message": str(exc),
                "hint": "Quota exceeded. Wait or use a different API key.",
            })
            yield f"event: error\ndata: {error_data}\n\n"
        except ValueError as exc:
            error_data = json.dumps({"message": str(exc)})
            yield f"event: error\ndata: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _has_env_key() -> bool:
    import os
    return bool(os.getenv("GEMINI_API_KEY"))
