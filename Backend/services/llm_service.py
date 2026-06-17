# services/llm_service.py

import asyncio
import json
import os
import time
from typing import Optional

from google import genai


QUOTA_ERROR_KEYWORDS = (
    "429",
    "425",
    "quota",
    "rate limit",
    "rate_limit",
    "resource exhausted",
    "resource_exhausted",
    "too many requests",
    "exceeded",
)


class GeminiQuotaError(Exception):
    """Raised when Gemini API quota is exhausted after all retries."""

    def __init__(self, message: str, retries: int = 0):
        super().__init__(message)
        self.retries = retries


class GeminiService:

    def __init__(
        self,
        api_key: Optional[str] = None,
        min_interval: float = 2.5,
        max_retries: int = 5,
    ):
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise ValueError(
                "Gemini API key is required. "
                "Provide it in the request or set GEMINI_API_KEY."
            )

        self.client = genai.Client(api_key=key)
        self.model = "gemini-2.5-flash"
        self._min_interval = min_interval
        self._max_retries = max_retries
        self._last_request_time = 0.0
        self._lock = asyncio.Lock()

    @staticmethod
    def is_quota_error(exc: Exception) -> bool:
        msg = str(exc).lower()
        return any(keyword in msg for keyword in QUOTA_ERROR_KEYWORDS)

    async def _rate_limit(self) -> None:
        async with self._lock:
            elapsed = time.time() - self._last_request_time
            if elapsed < self._min_interval:
                await asyncio.sleep(self._min_interval - elapsed)
            self._last_request_time = time.time()

    def _call_api(self, prompt: str):
        return self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )

    def _parse_response(self, text: str) -> dict:
        cleaned = (
            text.replace("```json", "")
            .replace("```", "")
            .strip()
        )

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {"raw_output": cleaned}

    async def generate_json(self, prompt: str) -> dict:
        last_error: Optional[Exception] = None

        for attempt in range(self._max_retries):
            await self._rate_limit()

            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: self._call_api(prompt),
                )

                text = response.text or ""
                return self._parse_response(text)

            except Exception as exc:
                last_error = exc

                if self.is_quota_error(exc) and attempt < self._max_retries - 1:
                    wait = min((2 ** attempt) * 5, 60)
                    await asyncio.sleep(wait)
                    continue

                if self.is_quota_error(exc):
                    raise GeminiQuotaError(
                        f"Gemini API quota exceeded after "
                        f"{self._max_retries} retries: {exc}",
                        retries=self._max_retries,
                    ) from exc

                raise

        raise GeminiQuotaError(
            f"Gemini API failed after {self._max_retries} retries: {last_error}",
            retries=self._max_retries,
        ) from last_error


def create_gemini_service(api_key: Optional[str] = None) -> GeminiService:
    return GeminiService(api_key=api_key)
