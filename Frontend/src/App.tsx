import { useEffect, useState, useRef } from "react";

import Navbar from "./components/layout/Navbar";
import Explorer from "./components/explorer/Explorer";
import EditorPanel from "./components/editor/EditorPanel";
import TeamLivePanel from "./components/chat/TeamLivePanel";
import AgentsPanel from "./components/chat/AgentsPanel";
import SemanticGraphExplorer from "./components/graph/SemanticGraphExplorer";

import { getProjects } from "./services/api/projects";
import { runAgentsStream, type AgentMessage } from "./services/api/agents";
import { useProjectStore } from "./store/projectStore";

type AppView = "agents" | "explorer" | "graph";

function App() {
  const [activeView, setActiveView] = useState<AppView>("explorer");

  // Lifted generation states
  const [prompt, setPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("orchestrator");
  const [targetProject, setTargetProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const abortRef = useRef<AbortController | null>(null);
  const terminalInputRef = useRef<HTMLInputElement | null>(null);

  // Sidebar Width States
  const [explorerWidth, setExplorerWidth] = useState(240);
  const [agentsPanelWidth, setAgentsPanelWidth] = useState(550);
  const [activeResizer, setActiveResizer] = useState<"explorer" | "team" | null>(null);

  const startResizeExplorer = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setActiveResizer("explorer");
    const startX = mouseDownEvent.clientX;
    const startWidth = explorerWidth;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      if (newWidth >= 160 && newWidth <= 450) {
        setExplorerWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      setActiveResizer(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const startResizeAgentsPanel = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setActiveResizer("team");
    const startX = mouseDownEvent.clientX;
    const startWidth = agentsPanelWidth;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      if (newWidth >= 300 && newWidth <= 900) {
        setAgentsPanelWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      setActiveResizer(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const {
    setProjects,
    geminiApiKey,
    clearLogs,
    addLog,
    setIsStreaming,
  } = useProjectStore();

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);



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

  const handleBroadcastClick = () => {
    terminalInputRef.current?.focus();
  };

  return (
    <div className="h-screen flex flex-col bg-background text-on-background font-sans text-ui overflow-hidden relative">
      {activeResizer && (
        <div className="fixed inset-0 z-[9999] cursor-col-resize select-none" />
      )}
      <Navbar
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {activeView !== "graph" ? (
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Sidebar */}
          <Explorer 
            activeProjectName={targetProject}
            onSelectProject={setTargetProject}
            width={explorerWidth}
          />

          {/* Left Resizer Handle */}
          <div
            onMouseDown={startResizeExplorer}
            className={`w-1.5 -ml-1 cursor-col-resize hover:bg-primary/50 transition-colors h-full z-50 flex-shrink-0 ${
              activeResizer === "explorer" ? "bg-primary" : ""
            }`}
          />

          {activeView === "explorer" ? (
            /* Developer Workspace (Editor only) */
            <section className="flex-1 flex flex-col bg-background relative overflow-hidden min-w-0">
              <EditorPanel />
            </section>
          ) : (
            /* Agents Collaboration Workspace (Chat logs + Team Roster) */
            <>
              {/* Center Panel: Full Chat Feed and Control Dock */}
              <AgentsPanel
                prompt={prompt}
                setPrompt={setPrompt}
                selectedAgent={selectedAgent}
                setSelectedAgent={setSelectedAgent}
                targetProject={targetProject}
                setTargetProject={setTargetProject}
                loading={loading}
                error={error}
                handleGenerate={handleGenerate}
                inputRef={terminalInputRef}
                width={agentsPanelWidth}
              />

              {/* Right Resizer Handle */}
              <div
                onMouseDown={startResizeAgentsPanel}
                className={`w-1.5 -mr-1 cursor-col-resize hover:bg-primary/50 transition-colors h-full z-50 flex-shrink-0 ${
                  activeResizer === "team" ? "bg-primary" : ""
                }`}
              />

              {/* Right Sidebar: Agent Swarm Control */}
              <TeamLivePanel
                selectedAgent={selectedAgent}
                setSelectedAgent={setSelectedAgent}
                onBroadcastClick={handleBroadcastClick}
              />
            </>
          )}
        </div>
      ) : (
        <SemanticGraphExplorer />
      )}
    </div>
  );
}

export default App;