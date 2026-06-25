import React, { useEffect, useRef } from "react";
import { useProjectStore } from "../../store/projectStore";

interface TerminalConsoleProps {
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
  height: number;
  setHeight: (height: number) => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function TerminalConsole({
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
  height,
  setHeight,
}: TerminalConsoleProps) {
  const { logs, geminiApiKey, setGeminiApiKey, isStreaming } = useProjectStore();
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleGenerate();
    }
  };

  const getTargetLabel = () => {
    if (selectedAgent === "orchestrator") {
      return "ALL_AGENTS (SWARM)";
    }
    return `${selectedAgent.toUpperCase()} (AGENT)`;
  };

  const startResize = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startY = mouseDownEvent.clientY;
    const startHeight = height;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newHeight = startHeight + (startY - mouseMoveEvent.clientY);
      // Min height 120px, max height 600px
      if (newHeight >= 120 && newHeight <= 600) {
        setHeight(newHeight);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div 
      style={{ height: `${height}px` }} 
      className="flex flex-col bg-background border-t border-outline flex-shrink-0 relative select-none"
    >
      {/* Resizer Handle */}
      <div
        onMouseDown={startResize}
        className="absolute top-0 left-0 right-0 h-1.5 -translate-y-1/2 cursor-ns-resize hover:bg-primary/45 transition-colors z-50"
      />
      {/* Console Header */}
      <div className="flex items-center justify-between px-3 h-8 bg-surface-container-low border-b border-outline flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">terminal</span> AGENT OUTPUT / LOGS
          </span>
          {isStreaming && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              <span className="text-[9px] font-mono text-tertiary uppercase font-bold tracking-wider">LIVE</span>
            </div>
          )}
        </div>

        <div className="flex gap-4 items-center">
          {/* Gemini API Key input */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-on-surface-variant opacity-65 uppercase">Gemini Key:</span>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="API Key..."
              className="bg-background border border-outline rounded px-2 py-0.5 text-[10px] w-32 text-primary font-mono focus:outline-none focus:border-primary placeholder:opacity-50"
            />
          </div>

          <span className="text-[10px] font-mono text-tertiary select-none">NODE: v20.11.0</span>
          <span className="text-[10px] font-mono text-on-surface-variant select-none">SH: ACTIVE (agent-env-v2)</span>
          <span className="material-symbols-outlined text-on-surface-variant text-[14px] cursor-pointer hover:text-primary transition-colors">expand_more</span>
          <span className="material-symbols-outlined text-on-surface-variant text-[14px] cursor-pointer hover:text-primary transition-colors">close</span>
        </div>
      </div>

      {/* Console Feed / Chat logs */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 font-mono text-[12px] min-h-0 bg-background">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-40 text-xs">
            <span className="material-symbols-outlined text-[24px] mb-1">smart_toy</span>
            <p>Awaiting commands... Mention an agent or type a task to start the swarm collaboration.</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const isThought = log.type === "thought";
            const isError = log.type === "error";
            const timeStr = formatTime(log.timestamp || (Date.now() / 1000));
            const sender = log.senderName || log.senderId;

            const isHighlighted = isThought || log.senderId === "system" || log.senderId === "orchestrator";

            return (
              <div 
                key={index} 
                className={`flex gap-2 py-0.5 px-2 rounded transition-colors ${
                  isError 
                    ? "bg-error/5 border-l-2 border-error" 
                    : isHighlighted
                      ? "bg-primary/5 border-l-2 border-primary/40"
                      : ""
                }`}
              >
                <span className="text-on-surface-variant opacity-40 shrink-0 select-none">{timeStr}</span>
                <span className={`${isError ? 'text-error' : isThought ? 'text-amber-500' : 'text-primary'} font-bold shrink-0 select-none`}>
                  [{sender.toUpperCase()}{isThought ? "/THOUGHT" : ""}]
                </span>
                <span className={`${isError ? 'text-error' : isThought ? 'text-amber-200/80 italic' : 'text-on-surface'} whitespace-pre-wrap`}>
                  {log.content}
                </span>
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Input Dock (Terminal style) */}
      <div className="p-2 border-t border-outline/50 bg-surface-container-low flex flex-col gap-2 flex-shrink-0">
        {/* Dynamic Targeting & Target Project badges */}
        <div id="agent-target-indicator" className="flex items-center gap-4 px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">Targeting:</span>
            <div className="flex items-center gap-1 bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-sm">
              <span className="text-[9px] font-mono font-bold text-primary">{getTargetLabel()}</span>
              {selectedAgent !== "orchestrator" && (
                <button
                  onClick={() => setSelectedAgent("orchestrator")}
                  className="material-symbols-outlined text-[12px] hover:text-error ml-1 cursor-pointer"
                >
                  close
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">Workspace:</span>
            <div className="flex items-center gap-1 bg-outline/25 border border-outline px-1.5 py-0.5 rounded-sm">
              <span className="text-[9px] font-mono text-on-surface">
                {targetProject || "AUTO-DETECT"}
              </span>
              {targetProject && (
                <button
                  onClick={() => setTargetProject("")}
                  className="material-symbols-outlined text-[12px] hover:text-error ml-1 cursor-pointer"
                >
                  close
                </button>
              )}
            </div>
          </div>

          {error && (
            <span className="text-[11px] text-error font-mono bg-error-container/20 border border-error-container/30 px-2 py-0.5 rounded ml-auto max-w-sm truncate" title={error}>
              {error}
            </span>
          )}
        </div>

        {/* Input box */}
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono font-bold text-[13px] ml-1 select-none">$</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-on-surface font-mono text-[13px] py-1 p-0 placeholder:text-on-surface-variant/40"
            placeholder={
              selectedAgent === "orchestrator"
                ? "Command or @mention agent..."
                : `Instruct @${selectedAgent}...`
            }
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex gap-2 items-center">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary text-[16px] cursor-pointer">
              attach_file
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary text-[16px] cursor-pointer mr-1">
              mic
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 select-none cursor-pointer shrink-0"
            >
              {loading ? "Run..." : "Run"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
