import axios from "axios";

import { API_BASE_URL } from "../../config/env";

export interface AgentMessage {
  type: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: number;
}

export interface AgentRunResponse {
  status: string;
  goal: string;
  error?: string;
  project_name?: string;
  project_path?: string;
  chat_log: AgentMessage[];
  graph: {
    nodes: Array<{ id: string; label: string; type: string }>;
    links: Array<{ source: string; target: string; label: string }>;
  };
  files_generated: number;
  agents: Record<string, unknown>;
}

export interface AgentRunOptions {
  agentId?: string;
  projectName?: string;
}

export type AgentStreamHandler = (
  event: string,
  data: unknown
) => void;

function parseSSEChunk(
  buffer: string,
  onEvent: AgentStreamHandler
): string {
  const parts = buffer.split("\n\n");
  const remaining = parts.pop() || "";

  for (const part of parts) {
    if (!part.trim()) continue;

    let eventType = "message";
    let dataLine = "";

    for (const line of part.split("\n")) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        dataLine = line.slice(6);
      }
    }

    if (dataLine) {
      try {
        onEvent(eventType, JSON.parse(dataLine));
      } catch {
        onEvent(eventType, dataLine);
      }
    }
  }

  return remaining;
}

export const runAgentsStream = async (
  prompt: string,
  geminiApiKey: string,
  onEvent: AgentStreamHandler,
  signal?: AbortSignal,
  options: AgentRunOptions = {}
): Promise<AgentRunResponse | null> => {
  const response = await fetch(
    `${API_BASE_URL}/agents/run/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        gemini_api_key: geminiApiKey,
        agent_id: options.agentId || "orchestrator",
        project_name: options.projectName || undefined,
      }),
      signal,
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const detail = errorBody?.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : `Request failed (${response.status})`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: AgentRunResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = parseSSEChunk(buffer, (event, data) => {
      if (event === "complete") {
        finalResult = data as AgentRunResponse;
      }
      onEvent(event, data);
    });
  }

  if (buffer.trim()) {
    parseSSEChunk(buffer + "\n\n", onEvent);
  }

  return finalResult;
};

export const runAgents = async (
  prompt: string,
  geminiApiKey?: string,
  options: AgentRunOptions = {}
): Promise<AgentRunResponse> => {
  const response = await axios.post<AgentRunResponse>(
    `${API_BASE_URL}/agents/run`,
    {
      prompt,
      gemini_api_key: geminiApiKey || undefined,
      agent_id: options.agentId || "orchestrator",
      project_name: options.projectName || undefined,
    },
    { timeout: 300000 }
  );

  return response.data;
};
