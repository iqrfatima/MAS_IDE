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

import { Folder } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import TreeNode from "./TreeNode";
import { buildTree } from "./buildTree";
import { readFile } from "../../services/api/projects";

function Explorer() {
  const {
  projects,
  openFile,
} = useProjectStore();

  return (
    <div className="w-72 bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto">
      <h2 className="text-white font-semibold mb-6">
        Explorer
      </h2>

      <div className="space-y-6">
        {projects.map((project, index) => {
          const tree = buildTree(
            project.files.map((file) => file.name)
          );

          return (
            <div key={index}>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                <Folder size={16} />
                {project.project_name}
              </div>

              <div className="ml-2">
                {Object.entries(tree).map(([key, value]) => (
                  <TreeNode
                    key={key}
                    name={key}
                    node={value}
                    onFileClick={async (path) => {
                      try {
                        const data =
                          await readFile(
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Explorer;