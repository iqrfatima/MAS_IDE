import { create } from "zustand";

import type { AgentMessage } from "../services/api/agents";
import type { Project } from "../types/project";

interface ProjectStore {
  projects: Project[];
  logs: AgentMessage[];
  geminiApiKey: string;
  isStreaming: boolean;

  setProjects: (projects: Project[]) => void;
  addLog: (log: AgentMessage) => void;
  setLogs: (logs: AgentMessage[]) => void;
  clearLogs: () => void;
  setGeminiApiKey: (key: string) => void;
  setIsStreaming: (streaming: boolean) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  logs: [],
  geminiApiKey: localStorage.getItem("gemini_api_key") || "",
  isStreaming: false,

  setProjects: (projects) => set({ projects }),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log],
    })),

  setLogs: (logs) => set({ logs }),

  clearLogs: () => set({ logs: [] }),

  setGeminiApiKey: (key) => {
    localStorage.setItem("gemini_api_key", key);
    set({ geminiApiKey: key });
  },

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
}));
