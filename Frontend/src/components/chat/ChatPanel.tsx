import { useRef, useState } from "react";

import {
  runAgentsStream,
  type AgentMessage,
} from "../../services/api/agents";
import { getProjects } from "../../services/api/projects";
// import {
//   generateProject
// } from "../../services/api/projects";
import { useProjectStore } from "../../store/projectStore";
import ChatMessages from "./ChatMessages";

const AGENT_OPTIONS = [
  { id: "orchestrator", label: "Orchestrator" },
  { id: "planner", label: "Planner" },
  { id: "architect", label: "Architect" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "database", label: "Database" },
  { id: "testing", label: "Testing" },
  { id: "reviewer", label: "Reviewer" },
  { id: "merge", label: "Code Merge" },
  { id: "devops", label: "DevOps" },
  { id: "writer", label: "Writer" },
  { id: "qa", label: "QA" },
];

function ChatPanel() {
  const [prompt, setPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("orchestrator");
  const [targetProject, setTargetProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const {
    projects,
    addLog,
    clearLogs,
    setProjects,
    geminiApiKey,
    setGeminiApiKey,
    setIsStreaming,
  } = useProjectStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (!geminiApiKey.trim()) {
      setError("Please enter your Gemini API key.");
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setIsStreaming(true);
    setError("");
    clearLogs();

    try {
      const result = await runAgentsStream(
        prompt,
        geminiApiKey,
        (event, data) => {
          if (event === "message") {
            addLog(data as AgentMessage);
          }
        },
        abortRef.current.signal,
        {
          agentId: selectedAgent,
          projectName:
            selectedAgent === "orchestrator"
              ? undefined
              : targetProject || undefined,
        }
      );

      if (result?.status === "quota_exceeded") {
        setError(
          "Gemini API quota exceeded. Wait a few minutes or use a different API key."
        );
        return;
      }

      if (result?.status === "error") {
        setError(result.error || "Agent pipeline failed.");
        return;
      }

      if (result?.status === "success") {
        const updatedProjects = await getProjects();
        setProjects(updatedProjects.projects);
        setPrompt("");

        if (!targetProject && result.project_name) {
          setTargetProject(result.project_name);
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      const message =
        err instanceof Error
          ? err.message
          : "Failed to run agents. Check backend and API key.";

      setError(message);
      addLog({
        type: "error",
        senderId: "system",
        senderName: "System",
        content: message,
        timestamp: Date.now() / 1000,
      });
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    // <div className="flex-1 flex flex-col bg-zinc-950">
      <div className="flex-1 flex flex-col bg-zinc-950 min-h-0">
      <ChatMessages />
      
      <div className="border-t border-zinc-800 p-6 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">
            Role-Based Multi-Agent AI System
          </h1>
          <p className="text-zinc-400 text-xs">
            Planner - Architect - Parallel Specialists - Reviewer - Merge - CI/CD
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-zinc-500 uppercase tracking-wide">
            Gemini API Key
          </label>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="Enter your Gemini API key..."
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wide">
              Agent Route
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-blue-600"
            >
              {AGENT_OPTIONS.map((agent) => (
                <option
                  key={agent.id}
                  value={agent.id}
                >
                  {agent.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wide">
              Target Project
            </label>
            <select
              value={targetProject}
              onChange={(e) => setTargetProject(e.target.value)}
              disabled={selectedAgent === "orchestrator"}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-blue-600 disabled:opacity-50"
            >
              <option value="">
                New project or auto-detect
              </option>
              {projects.map((project) => (
                <option
                  key={project.project_name}
                  value={project.project_name}
                >
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
            placeholder={
              selectedAgent === "orchestrator"
                ? "Create a flight management app..."
                : "Change the UI theme, add an endpoint, improve tests..."
            }
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-600"
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 rounded-lg font-medium"
          >
            {loading ? "Agents Working..." : "Generate"}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/30 border border-red-900 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-zinc-400 text-sm">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Agents are collaborating live. Watch the Team Communication panel.
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPanel;
