import { useEffect, useRef } from "react";
import { useProjectStore } from "../../store/projectStore";
import type { AgentMessage } from "../../services/api/agents";

interface ContentPart {
  type: 'text' | 'code' | 'diff';
  content: string;
  language?: string;
  fileName?: string;
}

function parseMessageContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const regex = /```(diff|[\w-]+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add preceding text part
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore.trim()) {
      parts.push({ type: 'text', content: textBefore });
    }

    const lang = match[1] || 'code';
    const codeContent = match[2];

    if (lang === 'diff' || codeContent.includes('\n- ') || codeContent.includes('\n+ ') || codeContent.startsWith('- ') || codeContent.startsWith('+ ')) {
      // It's a diff block!
      const lines = codeContent.split('\n');
      let fileName = 'diff-patch';
      let startIndex = 0;
      
      if (lines.length > 0 && lines[0].trim() && !lines[0].startsWith('-') && !lines[0].startsWith('+') && !lines[0].includes(' ') && lines[0].includes('.')) {
        fileName = lines[0].trim();
        startIndex = 1;
      }
      
      parts.push({
        type: 'diff',
        content: lines.slice(startIndex).join('\n'),
        fileName,
      });
    } else {
      parts.push({
        type: 'code',
        content: codeContent,
        language: lang,
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  const textAfter = content.substring(lastIndex);
  if (textAfter.trim() || parts.length === 0) {
    parts.push({ type: 'text', content: textAfter || content });
  }

  return parts;
}

function DiffBlock({ content, fileName }: { content: string; fileName: string }) {
  const lines = content.split('\n').filter(l => l.trim() || l === '');
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="border border-outline rounded-md my-3 bg-surface-container-low overflow-hidden font-mono text-[11px] shadow-sm select-text text-left">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-outline/50 bg-background/55 text-on-surface-variant select-none">
        <span className="font-bold text-[10px] uppercase tracking-wider">{fileName}</span>
        <button 
          onClick={handleCopy}
          className="material-symbols-outlined text-[14px] hover:text-primary transition-colors cursor-pointer"
          title="Copy Code"
        >
          content_copy
        </button>
      </div>

      {/* Diff Body */}
      <div className="overflow-x-auto p-1.5 bg-background/25 leading-normal">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              // Parse line numbers and line content
              const lineMatch = line.match(/^(\d+)?\s*(-\s|\+\s)?(.*)$/);
              let lineNum = '';
              let prefix = '';
              let codeText = line;

              if (lineMatch) {
                lineNum = lineMatch[1] || '';
                prefix = lineMatch[2]?.trim() || '';
                codeText = lineMatch[3] || '';
              } else {
                if (line.startsWith('-')) {
                  prefix = '-';
                  codeText = line.substring(1);
                } else if (line.startsWith('+')) {
                  prefix = '+';
                  codeText = line.substring(1);
                }
              }

              const isDeletion = prefix === '-';
              const isAddition = prefix === '+';

              const rowBg = isDeletion 
                ? 'bg-error/10 text-error-container/90' 
                : isAddition 
                  ? 'bg-tertiary/10 text-tertiary-fixed/90' 
                  : '';

              const lineNumColor = isDeletion
                ? 'text-error/50 bg-error/5'
                : isAddition
                  ? 'text-tertiary/50 bg-tertiary/5'
                  : 'text-on-surface-variant/40';

              return (
                <tr key={idx} className={`${rowBg} hover:bg-outline/5 transition-colors`}>
                  {/* Line Number Column */}
                  <td className={`w-10 px-2 py-0.5 text-right font-mono select-none border-r border-outline/25 ${lineNumColor}`}>
                    {lineNum || idx + 1}
                  </td>
                  {/* Prefix Column (+ / -) */}
                  <td className="w-6 px-2 py-0.5 text-center font-mono select-none">
                    {prefix && <span className={isDeletion ? 'text-error font-bold' : 'text-tertiary font-bold'}>{prefix}</span>}
                  </td>
                  {/* Code Column */}
                  <td className="px-3 py-0.5 whitespace-pre font-mono">
                    {codeText}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CodeBlock({ content, language }: { content: string; language?: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="border border-outline rounded-md my-3 bg-surface-container-low overflow-hidden font-mono text-[11px] shadow-sm select-text text-left">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-outline/50 bg-background/55 text-on-surface-variant select-none">
        <span className="font-bold text-[10px] uppercase tracking-wider">{language || 'code'}</span>
        <button 
          onClick={handleCopy}
          className="material-symbols-outlined text-[14px] hover:text-primary transition-colors cursor-pointer"
          title="Copy Code"
        >
          content_copy
        </button>
      </div>

      {/* Code Body */}
      <div className="overflow-x-auto p-3 bg-background/25 whitespace-pre leading-relaxed">
        <code>{content}</code>
      </div>
    </div>
  );
}

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
    <div className="flex-1 flex flex-col bg-background min-h-0">
      <div className="px-4 py-2 border-b border-outline flex items-center justify-between bg-surface-container-low select-none">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-on-surface opacity-60">Team Communication</h2>
        {isStreaming && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-tertiary uppercase tracking-wider">
              Live
            </span>
          </div>
        )}
      </div>
      
      <div
        className="
          flex-1
          min-h-0
          overflow-y-auto
          overflow-x-hidden
          p-4
          space-y-3
          custom-scrollbar
        "
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-40 text-[11px] font-mono">
            <span className="material-symbols-outlined text-[24px] mb-1">forum</span>
            <p>No messages yet. Start a collaboration to see team communication.</p>
          </div>
        ) : (
          logs.map((message: AgentMessage, index: number) => {
            const isThought = message.type === "thought";
            const isError = message.type === "error";
            const isSystem = message.senderId === "orchestrator" || message.senderId === "system";
            const avatarColor = AGENT_AVATAR_COLORS[message.senderId] || "bg-primary";

            return (
              <div key={index} className="flex gap-3">
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-[11px] font-mono font-bold text-white flex-shrink-0 select-none ${avatarColor}`}>
                  {getAvatarContent(message)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 select-none">
                    <span className="text-on-surface font-mono font-bold text-[11px]">
                      {getDisplayName(message).toUpperCase()}
                    </span>
                    <span className="text-on-surface-variant opacity-40 text-[9px] font-mono">
                      {formatTime(message.timestamp)}
                    </span>
                    {isThought && (
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        THOUGHT
                      </span>
                    )}
                  </div>
                  
                  <div className={`rounded-sm p-3 text-[12px] font-mono border ${
                    isThought
                      ? "bg-amber-500/5 border-amber-500/20 text-amber-200/80 italic"
                      : isError
                        ? "bg-error/5 border-error/25 text-error"
                        : isSystem
                          ? "bg-primary/5 border-primary/20 text-on-surface-variant"
                          : "bg-outline/5 border-outline/35 text-on-surface"
                  }`}>
                    {parseMessageContent(message.content).map((part, pIdx) => {
                      if (part.type === 'diff') {
                        return (
                          <DiffBlock 
                            key={pIdx} 
                            content={part.content} 
                            fileName={part.fileName || 'diff-patch'} 
                          />
                        );
                      }
                      if (part.type === 'code') {
                        return (
                          <CodeBlock 
                            key={pIdx} 
                            content={part.content} 
                            language={part.language} 
                          />
                        );
                      }
                      return (
                        <p key={pIdx} className="whitespace-pre-wrap leading-relaxed my-1">
                          {part.content}
                        </p>
                      );
                    })}
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
