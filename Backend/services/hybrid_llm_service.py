import logging
from typing import Callable, Optional

from services.llm_service import GeminiQuotaError, GeminiService
from services.openrouter_service import OpenRouterService

logger = logging.getLogger(__name__)

OPENROUTER_AGENTS = {
    "frontend",
    "backend",
    "database",
    "testing",
    "qa",
}


class HybridLLMService:

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        openrouter_api_key: Optional[str] = None,
        on_fallback: Optional[Callable[[str], None]] = None,
    ):
        self.gemini = GeminiService(
            api_key=gemini_api_key,
            max_retries=1,
        )
        self._openrouter_api_key = openrouter_api_key
        self._openrouter: Optional[OpenRouterService] = None
        self._on_fallback = on_fallback

    def _get_openrouter(self) -> OpenRouterService:
        if self._openrouter is None:
            self._openrouter = OpenRouterService(
                api_key=self._openrouter_api_key,
            )
        return self._openrouter

    async def generate_json(
        self,
        prompt: str,
        agent_id: str,
    ) -> dict:
        if agent_id in OPENROUTER_AGENTS:
            return await self._get_openrouter().generate_json(
                prompt,
                agent_id,
            )

        try:
            return await self.gemini.generate_json(prompt)
        except GeminiQuotaError as exc:
            logger.warning(
                "Gemini quota exceeded for agent %s, falling back to OpenRouter: %s",
                agent_id,
                exc,
            )
            if self._on_fallback:
                self._on_fallback(agent_id)
            return await self._get_openrouter().generate_json(
                prompt,
                agent_id,
            )


def create_hybrid_llm_service(
    gemini_api_key: Optional[str] = None,
    openrouter_api_key: Optional[str] = None,
    on_fallback: Optional[Callable[[str], None]] = None,
) -> HybridLLMService:
    return HybridLLMService(
        gemini_api_key=gemini_api_key,
        openrouter_api_key=openrouter_api_key,
        on_fallback=on_fallback,
    )


