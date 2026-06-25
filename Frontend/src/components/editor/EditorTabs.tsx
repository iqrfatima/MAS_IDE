// import { useProjectStore } from "../../store/projectStore";

// function EditorTabs() {
//   const {
//     openTabs,
//     activeTab,
//     setActiveTab,
//     closeTab,
//   } = useProjectStore();

//   return (
//     <div className="flex bg-zinc-900 border-b border-zinc-800">
//       {openTabs.map((tab) => (
//         <div
//           key={tab.path}
//           onClick={() =>
//             setActiveTab(tab.path)
//           }
//           className={`
//             px-4 py-2 text-sm
//             border-r border-zinc-800
//             cursor-pointer flex items-center gap-2
//             ${
//               activeTab === tab.path
//                 ? "bg-zinc-800 text-white"
//                 : "text-zinc-400"
//             }
//           `}
//         >
//           {tab.path.split("/").pop()}

//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               closeTab(tab.path);
//             }}
//           >
//             ×
//           </button>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default EditorTabs;

import { useProjectStore } from "../../store/projectStore";

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "code";
    case "css":
      return "css";
    case "json":
      return "data_object";
    case "md":
      return "description";
    default:
      return "description";
  }
}

function EditorTabs() {
  const {
    openTabs,
    activeTab,
    setActiveTab,
    closeTab,
  } = useProjectStore();

  return (
    <div className="flex bg-background border-b border-outline h-9 overflow-x-auto no-scrollbar flex-shrink-0 select-none">
      {openTabs.map((tab) => {
        const isActive = activeTab === tab.path;
        const filename = tab.path.split("/").pop() || "";

        return (
          <div
            key={tab.path}
            onClick={() => setActiveTab(tab.path)}
            className={`
              flex items-center gap-2 px-3 h-full border-r border-outline text-[12px] font-mono cursor-pointer transition-colors group select-none
              ${
                isActive
                  ? "active-tab"
                  : "text-on-surface-variant hover:bg-outline/10"
              }
            `}
          >
            <span className={`material-symbols-outlined text-[14px] ${isActive ? 'text-primary' : 'text-on-surface-variant/80'}`}>
              {getFileIcon(filename)}
            </span>
            <span>{filename}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.path);
              }}
              className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-65 hover:opacity-100 cursor-pointer ml-1 select-none transition-opacity duration-150"
            >
              close
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default EditorTabs;