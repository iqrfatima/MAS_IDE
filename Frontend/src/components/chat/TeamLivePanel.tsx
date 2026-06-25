import { useProjectStore } from "../../store/projectStore";

interface TeamLivePanelProps {
  selectedAgent: string;
  setSelectedAgent: (agentId: string) => void;
  onBroadcastClick: () => void;
  width?: number;
}

const AGENTS = [
  { id: "orchestrator", name: "ORCHESTRATOR", desc: "Swarm Coordinator", icon: "psychology", version: "v4.2.1 Core" },
  { id: "planner", name: "PLANNER", desc: "Task Planner & Analyser", icon: "assignment", version: "v2.1.0 Model" },
  { id: "architect", name: "ARCHITECT_PRO", desc: "System Design specialist", icon: "architecture", version: "v3.0.5 Agent" },
  { id: "frontend", name: "FRONTEND_DEV", desc: "UI Component Specialist", icon: "view_quilt", version: "v2.2.0 UI" },
  { id: "backend", name: "BACKEND_DEV", desc: "Business Logic specialist", icon: "dns", version: "v2.2.1 Core" },
  { id: "database", name: "DB_ADMIN", desc: "Schema Optimizer model", icon: "database", version: "v1.4.0 DB" },
  { id: "testing", name: "TEST_ENGINEER", desc: "Test Case Specialist", icon: "checklist", version: "v1.9.0 Test" },
  { id: "reviewer", name: "CODE_REVIEWER", desc: "PR Quality Auditor", icon: "rate_review", version: "v2.0.1 QA" },
  { id: "merge", name: "MERGE_BOT", desc: "Integrations Handler", icon: "merge", version: "v1.1.2 CI" },
  { id: "devops", name: "DEVOPS_ENG", desc: "Deployment & Environment", icon: "settings_suggest", version: "v1.5.0 K8s" },
];

export default function TeamLivePanel({
  selectedAgent,
  setSelectedAgent,
  onBroadcastClick,
  width,
}: TeamLivePanelProps) {
  const { logs, isStreaming } = useProjectStore();

  // Find recent warning logs to render as notifications at the top
  const warningLogs = logs
    .filter((log) => log.type === "error" || log.content.toLowerCase().includes("warning"))
    .slice(-2) // Show up to last 2 warnings
    .reverse();

  return (
    <aside 
      style={width ? { width: `${width}px` } : undefined}
      className={`${width ? "w-[280px] flex-shrink-0" : "flex-1 min-w-[200px]"} border-l border-outline bg-background flex flex-col h-full select-none`}
    >
      {/* Sidebar Header */}
      <div className="px-3 py-2 border-b border-outline flex items-center justify-between flex-shrink-0 bg-surface-container-low">
        <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">Team Control</span>
        <span className="bg-tertiary/10 text-tertiary text-[9px] px-1.5 py-0.5 rounded-sm border border-tertiary/20 font-bold">MONITORING</span>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
        
        {/* Warning Logs Section */}
        {warningLogs.length > 0 && (
          <div className="border-b border-outline/30">
            {warningLogs.map((log, idx) => (
              <div 
                key={idx} 
                className="p-3 border-b border-outline/30 hover:bg-outline/5 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">smart_toy</span>
                  <span className="text-[11px] font-mono font-bold text-primary">
                    {(log.senderName || log.senderId).toUpperCase()}_AI
                  </span>
                  <span className="ml-auto text-[10px] opacity-40">Just now</span>
                </div>
                <p className="text-[12px] text-on-surface leading-tight truncate" title={log.content}>
                  {log.content}
                </p>
                <div className="mt-2 flex gap-2">
                  <button className="text-[10px] font-bold text-primary hover:underline uppercase cursor-pointer">Fix</button>
                  <button className="text-[10px] font-bold opacity-40 hover:opacity-100 uppercase cursor-pointer">Ignore</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agent Roster Header */}
        <div className="px-3 py-2 opacity-40 text-[10px] uppercase font-bold tracking-widest border-b border-outline/30 mt-2 flex-shrink-0">
          Agent Roster
        </div>

        {/* Dynamic Agent Roster List */}
        <div className="divide-y divide-outline/10 flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {AGENTS.map((agent) => {
            const isSelected = selectedAgent === agent.id;
            const isAgentBusy = isStreaming && isSelected;
            
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`px-3 py-2 flex items-center gap-3 hover:bg-outline/10 cursor-pointer group transition-colors ${
                  isSelected 
                    ? "bg-primary/5" 
                    : ""
                }`}
                title={`Click to target @${agent.id} in terminal`}
              >
                {/* Status Dot */}
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isAgentBusy 
                    ? "bg-primary animate-pulse" 
                    : isStreaming 
                      ? "bg-primary/50" 
                      : "bg-tertiary"
                }`}></div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-mono font-bold ${
                      isSelected ? "text-primary" : "text-on-surface"
                    }`}>
                      {agent.name}
                    </span>
                    <span className={`text-[9px] font-mono ${
                      isAgentBusy 
                        ? "text-primary font-bold animate-pulse" 
                        : isStreaming 
                          ? "text-on-surface-variant opacity-50" 
                          : "text-tertiary"
                    }`}>
                      {isAgentBusy ? "BUSY" : isStreaming ? "WAITING" : "IDLE"}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-60 truncate mt-0.5">
                    {agent.desc} • {agent.version}
                  </div>
                </div>
              </div>
            );
          })}
        </div>


      </div>

      {/* Bottom Action */}
      <div className="p-3 border-t border-outline bg-surface-container-low flex-shrink-0">
        <button
          onClick={onBroadcastClick}
          className="w-full bg-outline/20 border border-outline text-on-surface font-bold text-[10px] py-1.5 hover:bg-primary hover:text-white transition-all uppercase tracking-widest rounded-sm cursor-pointer"
        >
          Broadcast Swarm
        </button>
      </div>
    </aside>
  );
}
