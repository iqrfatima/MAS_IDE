import { useEffect, useState, useRef } from "react";

import Navbar from "./components/layout/Navbar";
import Explorer from "./components/explorer/Explorer";
import EditorPanel from "./components/editor/EditorPanel";
import TerminalConsole from "./components/editor/TerminalConsole";
import TeamLivePanel from "./components/chat/TeamLivePanel";
import SemanticGraphExplorer from "./components/graph/SemanticGraphExplorer";

import { getProjects } from "./services/api/projects";
import { runAgentsStream, type AgentMessage } from "./services/api/agents";
import { useProjectStore } from "./store/projectStore";

type AppView = "ide" | "graph";

function App() {
  const [activeView, setActiveView] = useState<AppView>("ide");
  const [terminalHeight, setTerminalHeight] = useState(256);

  // Lifted generation states
  const [prompt, setPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("orchestrator");
  const [targetProject, setTargetProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const abortRef = useRef<AbortController | null>(null);
  const terminalInputRef = useRef<HTMLInputElement | null>(null);

  const {
    projects,
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

  // Sync first project as targetProject when projects load
  useEffect(() => {
    if (projects.length > 0 && !targetProject) {
      setTargetProject(projects[0].project_name);
    }
  }, [projects, targetProject]);

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
    <div className="h-screen flex flex-col bg-background text-on-background font-sans text-ui overflow-hidden">
      <Navbar
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {activeView === "ide" ? (
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Sidebar */}
          <Explorer 
            activeProjectName={targetProject}
            onSelectProject={setTargetProject}
          />

          {/* Center Stage */}
          <section className="flex-1 flex flex-col bg-background relative overflow-hidden min-w-0">
            {/* Top Half: Editor */}
            <div className="flex-1 flex flex-col border-b border-outline min-h-[40%] overflow-hidden">
              <EditorPanel />
            </div>

            {/* Bottom Half: Terminal Console */}
            <TerminalConsole
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
              height={terminalHeight}
              setHeight={setTerminalHeight}
            />
          </section>

          {/* Right Sidebar */}
          <TeamLivePanel
            selectedAgent={selectedAgent}
            setSelectedAgent={setSelectedAgent}
            onBroadcastClick={handleBroadcastClick}
          />
        </div>
      ) : (
        <SemanticGraphExplorer />
      )}
    </div>
  );
}

export default App;