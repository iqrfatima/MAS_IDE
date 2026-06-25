import asyncio
import json
import os
from typing import Optional

from openai import OpenAI

# OpenRouter model IDs (see https://openrouter.ai/models)
REASONING_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"
CODE_MODEL = "openai/gpt-oss-20b"

OPENROUTER_MODELS = {
    "planner": REASONING_MODEL,
    "architect": REASONING_MODEL,
    "reviewer": REASONING_MODEL,
    "merge": REASONING_MODEL,
    "testing": REASONING_MODEL,
    "qa": REASONING_MODEL,
    "frontend": CODE_MODEL,
    "backend": CODE_MODEL,
    "database": CODE_MODEL,
}


class OpenRouterService:

    def __init__(self, api_key: Optional[str] = None):
        key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not key:
            raise ValueError(
                "OpenRouter API key is required. "
                "Set OPENROUTER_API_KEY in your environment."
            )

        self.client = OpenAI(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
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

    def _call_api(self, prompt: str, model: str) -> str:
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0.2,
        )

        return response.choices[0].message.content or ""

    async def generate_json(
        self,
        prompt: str,
        agent_id: str,
    ) -> dict:
        model = OPENROUTER_MODELS.get(
            agent_id,
            CODE_MODEL,
        )

        loop = asyncio.get_event_loop()

        text = await loop.run_in_executor(
            None,
            lambda: self._call_api(prompt, model),
        )

        return self._parse_response(text)
