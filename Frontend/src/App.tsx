// import { useEffect, useState } from "react";

// import Sidebar from "./components/Sidebar";
// import Workspace from "./components/Workspace";
// import Navbar from "./components/layout/Navbar";

// import { getProjects } from "./services/api/projects";

// function App() {

//   const [projects, setProjects] = useState<any[]>([]);

//   const loadProjects = async () => {

//     const data = await getProjects();

//     setProjects(data.projects || []);
//   };

//   useEffect(() => {
//     loadProjects();
//   }, []);

//   return (
//     <div className="h-screen flex flex-col bg-zinc-950 text-white">

//       <Navbar />

//       <div className="flex flex-1 overflow-hidden">

//         <Sidebar projects={projects} />

//         <Workspace refreshProjects={loadProjects} />

//       </div>

//     </div>
//   );
// }

// export default App;
import { useEffect } from "react";

import Navbar
  from "./components/layout/Navbar";

import Explorer
  from "./components/explorer/explorer";

import ChatPanel
  from "./components/chat/ChatPanel";

import LogsPanel
  from "./components/logs/LogsPanel";

import {
  getProjects
} from "./services/api/projects";

import {
  useProjectStore
} from "./store/projectStore";

function App() {

  const {
    setProjects
  } = useProjectStore();

  const loadProjects =
    async () => {

      const data =
        await getProjects();

      setProjects(
        data.projects
      );
    };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-zinc-950">

      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        <Explorer />

        <ChatPanel />

        <LogsPanel />

      </div>

    </div>
  );
}

export default App;