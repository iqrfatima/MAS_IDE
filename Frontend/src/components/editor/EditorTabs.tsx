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

import { X } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";

function EditorTabs() {
  const {
    openTabs,
    activeTab,
    setActiveTab,
    closeTab,
  } = useProjectStore();

  return (
    <div className="flex bg-zinc-900 border-b border-zinc-800 overflow-x-auto">
      {openTabs.map((tab) => (
        <div
          key={tab.path}
          onClick={() =>
            setActiveTab(tab.path)
          }
          className={`
            flex items-center
            gap-2
            px-4
            py-2
            text-sm
            cursor-pointer
            border-r border-zinc-800
            min-w-fit
            ${
              activeTab === tab.path
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-850"
            }
          `}
        >
          <span>
            {tab.path
              .split("/")
              .pop()}
          </span>

          <X
            size={14}
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.path);
            }}
            className="hover:text-red-400"
          />
        </div>
      ))}
    </div>
  );
}

export default EditorTabs;