import React from "react";
import { useProjectStore } from "../../store/projectStore";
import ChatMessages from "./ChatMessages";

interface AgentsPanelProps {
  prompt: string;
  setPrompt: (val: string) => void;
  selectedAgent: string;
  setSelectedAgent: (val: string) => void;
  targetProject: string;
  setTargetProject: (val: string) => void;
  loading: boolean;
  error: string;
  handleGenerate: () => Promise<void>;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  width?: number;
}

const AGENT_OPTIONS = [
  { id: "orchestrator", label: "Orchestrator (Swarm)" },
  { id: "planner", label: "Planner" },
  { id: "architect", label: "Architect" },
  { id: "frontend", label: "Frontend Developer" },
  { id: "backend", label: "Backend Developer" },
  { id: "database", label: "Database Admin" },
  { id: "testing", label: "Test Engineer" },
  { id: "reviewer", label: "Code Reviewer" },
  { id: "merge", label: "Code Merge Bot" },
  { id: "devops", label: "DevOps Engineer" },
  { id: "writer", label: "Technical Writer" },
  { id: "qa", label: "QA Engineer" },
];

export default function AgentsPanel({
  prompt,
  setPrompt,
  selectedAgent,
  setSelectedAgent,
  targetProject,
  setTargetProject,
  loading,
  error,
  handleGenerate,
  inputRef,
  width,
}: AgentsPanelProps) {
  const { projects, geminiApiKey, setGeminiApiKey, isStreaming } = useProjectStore();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleGenerate();
    }
  };

  return (
    <div 
      style={width ? { width: `${width}px` } : undefined}
      className={`${width ? "flex-shrink-0" : "flex-1"} flex flex-col bg-background min-h-0 relative`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 bg-surface-container-low border-b border-outline flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">forum</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
            Team Communication
          </span>
          {isStreaming && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              <span className="text-[9px] font-mono text-tertiary uppercase font-bold tracking-wider">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ChatMessages />
      </div>

      {/* Input / Control Dock */}
      <div className="p-3 border-t border-outline bg-surface-container-low flex flex-col gap-2.5 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
          {/* Gemini API Key input */}
          <div className="flex items-center gap-1.5">
            <span className="text-on-surface-variant/70 uppercase text-[9px] tracking-wider font-bold">Gemini Key:</span>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Enter API Key..."
              className="bg-background border border-outline rounded-sm px-2 py-0.5 text-[10px] w-40 text-primary font-mono focus:outline-none focus:border-primary placeholder:opacity-40"
            />
          </div>

          {/* Agent Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-on-surface-variant/70 uppercase text-[9px] tracking-wider font-bold">Route To:</span>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-background border border-outline rounded-sm px-2 py-0.5 text-[10px] text-primary font-mono focus:outline-none focus:border-primary cursor-pointer"
            >
              {AGENT_OPTIONS.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Project Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-on-surface-variant/70 uppercase text-[9px] tracking-wider font-bold">Project:</span>
            <select
              value={targetProject}
              onChange={(e) => setTargetProject(e.target.value)}
              disabled={selectedAgent === "orchestrator"}
              className="bg-background border border-outline rounded-sm px-2 py-0.5 text-[10px] text-primary font-mono focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
            >
              <option value="">New project / Auto-detect</option>
              {projects.map((project) => (
                <option key={project.project_name} value={project.project_name}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <span className="text-[10px] text-error font-mono bg-error/5 border border-error/25 px-2 py-0.5 rounded ml-auto max-w-sm truncate" title={error}>
              {error}
            </span>
          )}
        </div>

        {/* Input Box */}
        <div className="flex flex-col gap-2 bg-background border border-outline rounded-xl p-3 focus-within:border-primary/80 transition-all shadow-md">
          {/* Top text input row */}
          <div className="flex items-center gap-2">
            <span className="text-primary font-mono font-bold text-[13px] select-none">$</span>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-on-surface font-mono text-[13px] py-0.5 p-0 placeholder:text-on-surface-variant/40"
              placeholder={
                selectedAgent === "orchestrator"
                  ? "Send command or start a collaboration task..."
                  : `Instruct @${selectedAgent}...`
              }
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Bottom toolbar row */}
          <div className="flex items-center justify-between border-t border-outline/30 pt-2 flex-shrink-0">
            {/* Left toolbar options */}
            <div className="flex items-center gap-2 select-none">
              <button 
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-outline/10 text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                title="Search Web"
              >
                <span className="material-symbols-outlined text-[16px]">language</span>
              </button>
              <button 
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-outline/10 text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                title="Upload image/file"
              >
                <span className="material-symbols-outlined text-[16px]">image</span>
              </button>
              <button 
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-outline/10 text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                title="Knowledge graph query"
              >
                <span className="material-symbols-outlined text-[16px]">hub</span>
              </button>
              
              {/* Special purple button indicator */}
              <button 
                type="button"
                className="relative w-6 h-6 flex items-center justify-center rounded-full hover:bg-outline/10 transition-all cursor-pointer group"
                title="Toggle Swarm Reasoning Mode"
              >
                <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    className="stroke-outline-variant"
                    strokeWidth="2"
                    fill="transparent"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    className="stroke-purple-500"
                    strokeWidth="2.5"
                    fill="transparent"
                    strokeDasharray={53.4}
                    strokeDashoffset={16}
                  />
                </svg>
                <span className="absolute w-1.5 h-1.5 bg-purple-500 rounded-full group-hover:scale-125 transition-transform" />
              </button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-outline/10 text-on-surface-variant hover:text-primary transition-all cursor-pointer select-none"
              >
                <span className="material-symbols-outlined text-[16px]">mic</span>
              </button>
              
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 select-none cursor-pointer flex items-center gap-1"
              >
                {loading ? "Running..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
