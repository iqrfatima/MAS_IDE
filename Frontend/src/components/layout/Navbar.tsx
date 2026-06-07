type AppView = "generator" | "graph";

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
      ? "bg-zinc-800 text-white"
      : "text-zinc-400 hover:text-white";

  return (
    <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">

      <div className="flex items-center gap-6">

        <div className="text-white font-semibold">
          MAS AI IDE
        </div>

        <div className="flex gap-1">
          <button
            onClick={() =>
              onViewChange("generator")
            }
            className={`px-3 py-1.5 rounded-lg text-sm ${tabClass("generator")}`}
          >
            Generator
          </button>

          <button
            onClick={() =>
              onViewChange("graph")
            }
            className={`px-3 py-1.5 rounded-lg text-sm ${tabClass("graph")}`}
          >
            Knowledge Graph
          </button>
        </div>

      </div>

      <div className="text-zinc-400 text-sm">
        AI Developer Environment
      </div>

    </div>
  );
}

export default Navbar;