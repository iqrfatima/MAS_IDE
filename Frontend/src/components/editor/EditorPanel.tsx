// import { useProjectStore } from "../../store/projectStore";
// import EditorTabs from "./EditorTabs";

// function EditorPanel() {
//   const {
//     openTabs,
//     activeTab,
//   } = useProjectStore();

//   const activeFile =
//     openTabs.find(
//       (tab) =>
//         tab.path === activeTab
//     );

//   return (
//     <div className="flex-1 flex flex-col bg-zinc-950">
//       <EditorTabs />

//       <div className="flex-1 overflow-auto">
//         {activeFile ? (
//           <pre className="p-4 text-sm text-zinc-200 whitespace-pre-wrap">
//             {activeFile.content}
//           </pre>
//         ) : (
//           <div className="h-full flex items-center justify-center text-zinc-500">
//             Open a file from Explorer
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default EditorPanel;

import Editor from "@monaco-editor/react";
import { useProjectStore } from "../../store/projectStore";
import { getLanguage } from "./getLanguage";
import EditorTabs from "./EditorTabs";

function EditorPanel() {
  const {
    openTabs,
    activeTab,
  } = useProjectStore();

  const activeFile = openTabs.find(
    (tab) => tab.path === activeTab
  );

  return (
    <div className="flex-1 flex flex-col bg-surface-container-low h-full overflow-hidden">
      <EditorTabs />

      <div className="flex-1 min-h-0 relative">
        {activeFile ? (
          <Editor
            height="100%"
            theme="vs-dark"
            path={activeFile.path}
            value={activeFile.content}
            language={getLanguage(
              activeFile.path
            )}
            options={{
              minimap: {
                enabled: true,
              },
              fontSize: 12,
              fontFamily: "JetBrains Mono, monospace",
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant opacity-40 text-xs gap-2 select-none">
            <span className="material-symbols-outlined text-[42px]">code</span>
            <p>Select a file from the Explorer to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditorPanel;