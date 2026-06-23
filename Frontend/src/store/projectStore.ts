// import { create } from "zustand";

// import type { AgentMessage } from "../services/api/agents";
// import type { Project } from "../types/project";

// interface ProjectStore {
//   projects: Project[];
//   logs: AgentMessage[];
//   geminiApiKey: string;
//   isStreaming: boolean;

//   setProjects: (projects: Project[]) => void;
//   addLog: (log: AgentMessage) => void;
//   setLogs: (logs: AgentMessage[]) => void;
//   clearLogs: () => void;
//   setGeminiApiKey: (key: string) => void;
//   setIsStreaming: (streaming: boolean) => void;
// }

// export const useProjectStore = create<ProjectStore>((set) => ({
//   projects: [],
//   logs: [],
//   geminiApiKey: localStorage.getItem("gemini_api_key") || "",
//   isStreaming: false,

//   setProjects: (projects) => set({ projects }),

//   addLog: (log) =>
//     set((state) => ({
//       logs: [...state.logs, log],
//     })),

//   setLogs: (logs) => set({ logs }),

//   clearLogs: () => set({ logs: [] }),

//   setGeminiApiKey: (key) => {
//     localStorage.setItem("gemini_api_key", key);
//     set({ geminiApiKey: key });
//   },

//   setIsStreaming: (streaming) => set({ isStreaming: streaming }),
// }));

// import { create } from "zustand";

// import type { AgentMessage } from "../services/api/agents";
// import type { Project } from "../types/project";

// export interface SelectedFile {
//   path: string;
//   content: string;
// }

// interface ProjectStore {
//   projects: Project[];
//   logs: AgentMessage[];
//   geminiApiKey: string;
//   isStreaming: boolean;

//   selectedFile: SelectedFile | null;

//   setProjects: (projects: Project[]) => void;
//   addLog: (log: AgentMessage) => void;
//   setLogs: (logs: AgentMessage[]) => void;
//   clearLogs: () => void;
//   setGeminiApiKey: (key: string) => void;
//   setIsStreaming: (streaming: boolean) => void;
  

//   setSelectedFile: (
//     file: SelectedFile
//   ) => void;
// }

// export const useProjectStore =
//   create<ProjectStore>((set) => ({
//     projects: [],
//     logs: [],
//     geminiApiKey:
//       localStorage.getItem(
//         "gemini_api_key"
//       ) || "",
//     isStreaming: false,

//     selectedFile: null,

//     setProjects: (projects) =>
//       set({ projects }),

//     addLog: (log) =>
//       set((state) => ({
//         logs: [...state.logs, log],
//       })),

//     setLogs: (logs) =>
//       set({ logs }),

//     clearLogs: () =>
//       set({ logs: [] }),

//     setGeminiApiKey: (key) => {
//       localStorage.setItem(
//         "gemini_api_key",
//         key
//       );

//       set({
//         geminiApiKey: key,
//       });
//     },

//     setIsStreaming: (streaming) =>
//       set({
//         isStreaming: streaming,
//       }),

//     setSelectedFile: (file) =>
//       set({
//         selectedFile: file,
//       }),
    
//   }));


import { create } from "zustand";

import type { AgentMessage } from "../services/api/agents";
import type { Project } from "../types/project";

export interface OpenFile {
  path: string;
  content: string;
}

interface ProjectStore {
  projects: Project[];
  logs: AgentMessage[];
  geminiApiKey: string;
  isStreaming: boolean;

  // VS Code Editor State
  openTabs: OpenFile[];
  activeTab: string | null;

  setProjects: (projects: Project[]) => void;
  addLog: (log: AgentMessage) => void;
  setLogs: (logs: AgentMessage[]) => void;
  clearLogs: () => void;
  setGeminiApiKey: (key: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  

  openFile: (file: OpenFile) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  logs: [],
  geminiApiKey:
    localStorage.getItem("gemini_api_key") || "",
  isStreaming: false,

  openTabs: [],
  activeTab: null,

  setProjects: (projects) =>
    set({ projects }),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log],
    })),

  setLogs: (logs) =>
    set({ logs }),

  clearLogs: () =>
    set({ logs: [] }),

  setGeminiApiKey: (key) => {
    localStorage.setItem(
      "gemini_api_key",
      key
    );

    set({
      geminiApiKey: key,
    });
  },

  setIsStreaming: (streaming) =>
    set({
      isStreaming: streaming,
    }),

  

  openFile: (file) =>
    set((state) => {
      const existing = state.openTabs.find(
        (tab) => tab.path === file.path
      );

      if (existing) {
        return {
          activeTab: file.path,
        };
      }

      return {
        openTabs: [
          ...state.openTabs,
          file,
        ],
        activeTab: file.path,
      };
    }),

  closeTab: (path) =>
    set((state) => {
      const index =
        state.openTabs.findIndex(
          (tab) => tab.path === path
        );

      const remainingTabs =
        state.openTabs.filter(
          (tab) => tab.path !== path
        );

      let nextActive =
        state.activeTab;

      if (
        state.activeTab === path
      ) {
        if (
          remainingTabs.length === 0
        ) {
          nextActive = null;
        } else if (index > 0) {
          nextActive =
            remainingTabs[
              index - 1
            ].path;
        } else {
          nextActive =
            remainingTabs[0].path;
        }
      }

      return {
        openTabs: remainingTabs,
        activeTab: nextActive,
      };
    }),

  setActiveTab: (path) =>
    set({
      activeTab: path,
    }),
}));