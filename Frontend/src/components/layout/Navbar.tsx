type AppView = "agents" | "explorer" | "graph";

interface NavbarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

function Navbar({
  activeView,
  onViewChange,
}: NavbarProps) {

  const tabClass = (view: AppView) =>
    activeView === view
      ? "px-2 py-0.5 text-on-surface hover:bg-outline/20 rounded-sm transition-colors text-[11px] font-mono bg-outline/15 select-none cursor-pointer"
      : "px-2 py-0.5 text-on-surface-variant hover:text-on-surface hover:bg-outline/20 rounded-sm transition-colors text-[11px] font-mono select-none cursor-pointer";

  return (
    <header className="bg-surface-container-low border-b border-outline h-9 flex justify-between items-center px-3 flex-shrink-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">terminal</span>
          <span className="font-mono font-bold tracking-tight text-[13px] uppercase select-none">MAS AI IDE</span>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onViewChange("agents")}
            className={tabClass("agents")}
          >
            Agents
          </button>
          <button
            onClick={() => onViewChange("explorer")}
            className={tabClass("explorer")}
          >
            Explorer
          </button>
          <button
            onClick={() => onViewChange("graph")}
            className={tabClass("graph")}
          >
            Knowledge Graph
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2 py-0.5 bg-outline/10 border border-outline rounded-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
          <span className="font-mono text-[10px] text-tertiary uppercase tracking-wider select-none">Cluster Active</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-[18px] cursor-pointer">
            search
          </button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-[18px] cursor-pointer">
            settings
          </button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-[18px] cursor-pointer">
            account_circle
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;