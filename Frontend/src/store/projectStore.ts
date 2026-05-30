import { create } from "zustand";

import type { Project } from "../types/project";

interface ProjectStore {

  projects: Project[];

  logs: string[];

  setProjects: (
    projects: Project[]
  ) => void;

  addLog: (
    log: string
  ) => void;

  clearLogs: () => void;
}

export const useProjectStore =
  create<ProjectStore>((set) => ({

    projects: [],

    logs: [],

    setProjects: (projects) =>
      set({ projects }),

    addLog: (log) =>
      set((state) => ({
        logs: [...state.logs, log],
      })),

    clearLogs: () =>
      set({
        logs: [],
      }),

  }));