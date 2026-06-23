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
    <div className="flex-1 flex flex-col bg-zinc-950">
      <EditorTabs />

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
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      ) : (
        <div
          className="
            flex-1
            flex
            items-center
            justify-center
            text-zinc-500
          "
        >
          Open a file from Explorer
        </div>
      )}
    </div>
  );
}

export default EditorPanel;