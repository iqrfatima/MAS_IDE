import { useEffect, useRef } from "react";
import { useProjectStore } from "../../store/projectStore";
import type { AgentMessage } from "../../services/api/agents";

const AGENT_AVATAR_COLORS: Record<string, string> = {
  architect: "bg-purple-600",
  frontend: "bg-blue-600",
  backend: "bg-green-600",
  qa: "bg-yellow-600",
  devops: "bg-orange-600",
  writer: "bg-pink-600",
  orchestrator: "bg-cyan-700",
  system: "bg-zinc-600",
};

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function getDisplayName(log: AgentMessage): string {
  if (log.senderName) return log.senderName;
  if (log.senderId === "orchestrator") return "System";
  return log.senderId.charAt(0).toUpperCase() + log.senderId.slice(1);
}

function getAvatarContent(log: AgentMessage): string {
  if (log.senderId === "orchestrator" || log.senderId === "system") {
    return "S";
  }
  return getDisplayName(log).charAt(0).toUpperCase();
}

function ChatMessages() {
  const { logs, isStreaming } = useProjectStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">TEAM COMMUNICATION</h2>
        {isStreaming && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
              Live
            </span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500">
            <p>No messages yet. Start a conversation to see team communication.</p>
          </div>
        ) : (
          logs.map((message: AgentMessage, index: number) => {
            const isThought = message.type === "thought";
            const isError = message.type === "error";
            const isSystem = message.senderId === "orchestrator" || message.senderId === "system";
            const avatarColor = AGENT_AVATAR_COLORS[message.senderId] || "bg-indigo-600";

            return (
              <div key={index} className="flex gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${avatarColor}`}>
                  {getAvatarContent(message)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">
                      {getDisplayName(message)}
                    </span>
                    <span className="text-zinc-500 text-xs">
                      {formatTime(message.timestamp)}
                    </span>
                    {isThought && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        THOUGHT
                      </span>
                    )}
                  </div>
                  
                  <div className={`rounded-lg p-4 text-sm ${
                    isThought
                      ? "bg-orange-950/30 border border-orange-700/40 text-orange-100 italic"
                      : isError
                        ? "bg-red-950/40 border border-red-800/50 text-red-200"
                        : isSystem
                          ? "bg-blue-600/20 border border-blue-500/30 text-zinc-300"
                          : "bg-zinc-800 border border-zinc-700 text-zinc-300"
                  }`}>
                    <p className="whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatMessages;
