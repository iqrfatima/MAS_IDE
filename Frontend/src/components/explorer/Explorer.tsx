// import { Folder, File } from "lucide-react";

// import { useProjectStore } from "../../store/projectStore";

// function Explorer() {

//   const { projects } = useProjectStore();

//   return (
//     <div className="w-72 bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto">

//       <h2 className="text-white font-semibold mb-6">
//         Explorer
//       </h2>

//       <div className="space-y-6">

//         {projects.map((project, index) => (

//           <div key={index}>

//             <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">

//               <Folder size={16} />

//               {project.project_name}

//             </div>

//             <div className="ml-6 space-y-2">

//               {project.files.map((file, idx) => (

//                 <div
//                   key={idx}
//                   className="flex items-center gap-2 text-zinc-300 text-sm"
//                 >

//                   <File size={14} />

//                   {file.name}

//                 </div>

//               ))}

//             </div>

//           </div>

//         ))}

//       </div>

//     </div>
//   );
// }

// export default Explorer;

// import { Folder } from "lucide-react";
// import { useProjectStore } from "../../store/projectStore";
// import TreeNode from "./TreeNode";
// import { buildTree } from "./buildTree";


// function Explorer() {
//   const { projects } = useProjectStore();

//   return (
//     <div className="w-72 bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto">
//       <h2 className="text-white font-semibold mb-6">
//         Explorer
//       </h2>

//       <div className="space-y-6">
//         {projects.map((project, index) => {
//           const tree = buildTree(
//             project.files.map((file) => file.name)
//           );

//           return (
//             <div key={index}>
//               <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
//                 <Folder size={16} />
//                 {project.project_name}
//               </div>

//               <div className="ml-2">
//                 {Object.entries(tree).map(([key, value]) => (
//                 <TreeNode
//                   key={key}
//                   name={key}
//                   node={value}
//                   onFileClick={(path) => {
//                   console.log(path);
//                    // Later:
//                     // openFile(path);
//                     // setSelectedFile(path);
//                 }}
//                 />
//                 ))}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// export default Explorer;

import { useProjectStore } from "../../store/projectStore";
import TreeNode from "./TreeNode";
import { buildTree } from "./buildTree";
import { readFile } from "../../services/api/projects";

interface ExplorerProps {
  activeProjectName: string;
  onSelectProject: (name: string) => void;
}

function Explorer({
  activeProjectName,
  onSelectProject,
}: ExplorerProps) {
  const {
    projects,
    openFile,
  } = useProjectStore();

  return (
    <aside className="w-[240px] flex-shrink-0 border-r border-outline bg-surface-container-low flex flex-col h-full select-none">
      {/* Sidebar Header */}
      <div className="px-3 py-2 flex items-center justify-between opacity-60 flex-shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider">Explorer</span>
        <div className="flex gap-1.5">
          <span className="material-symbols-outlined text-[16px] cursor-pointer hover:text-primary" title="Create File">note_add</span>
          <span className="material-symbols-outlined text-[16px] cursor-pointer hover:text-primary" title="Create Folder">create_new_folder</span>
          <span className="material-symbols-outlined text-[16px] cursor-pointer hover:text-primary" title="Refresh">refresh</span>
        </div>
      </div>

      {/* Workspace Project Dropdown Selector */}
      {projects.length > 0 && (
        <div className="px-3 pb-2 border-b border-outline/50 bg-surface-container-low flex flex-col gap-1 flex-shrink-0">
          <span className="text-[9px] font-mono text-on-surface-variant/70 uppercase tracking-widest">Workspace</span>
          <select 
            value={activeProjectName}
            onChange={(e) => onSelectProject(e.target.value)}
            className="w-full bg-background border border-outline rounded px-2 py-0.5 text-[11px] text-primary font-mono focus:outline-none focus:border-primary cursor-pointer"
          >
            {projects.map((project) => (
              <option key={project.project_name} value={project.project_name}>
                {project.project_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Folder Tree List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[12px] text-on-surface-variant py-2">
        {projects.length === 0 ? (
          <div className="px-3 py-4 text-center opacity-40 text-[11px]">
            No projects found.
          </div>
        ) : (
          projects.map((project) => {
            const isActive = project.project_name === activeProjectName;
            const tree = buildTree(
              project.files.map((file) => file.name)
            );

            return (
              <div key={project.project_name} className="mb-0.5">
                {/* Project Directory Header */}
                <div 
                  onClick={() => onSelectProject(project.project_name)}
                  className={`flex items-center gap-1.5 px-3 py-1 hover:bg-outline/20 cursor-pointer group transition-colors ${
                    isActive ? "text-on-surface bg-outline/10" : "text-on-surface-variant opacity-75"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isActive ? "expand_more" : "chevron_right"}
                  </span>
                  <span className="truncate flex-1">{project.project_name}</span>
                </div>

                {/* Recursive tree nodes */}
                {isActive && (
                  <div className="pl-3 mt-0.5">
                    {Object.entries(tree).map(([key, value]) => (
                      <TreeNode
                        key={key}
                        name={key}
                        node={value}
                        onFileClick={async (path) => {
                          try {
                            const data = await readFile(
                              project.project_name,
                              path
                            );

                            openFile({
                              path: data.path,
                              content: data.content,
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

export default Explorer;