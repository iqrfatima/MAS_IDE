import { useState } from "react";

import {
  generateProject,
  getProjects
} from "../../services/api/projects";

import {
  useProjectStore
} from "../../store/projectStore";

function ChatPanel() {

  const [prompt, setPrompt] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const {
    addLog,
    clearLogs,
    setProjects
  } = useProjectStore();

  const handleGenerate =
    async () => {

      if (!prompt) return;

      setLoading(true);

      clearLogs();

      addLog(
        "[System] Starting generation..."
      );

      addLog(
        "[AI] Processing prompt..."
      );

      addLog(
        "[Backend] Creating project..."
      );

      await generateProject(prompt);

      addLog(
        "[Filesystem] Writing files..."
      );

      const updatedProjects =
        await getProjects();

      setProjects(
        updatedProjects.projects
      );

      addLog(
        "[Success] Project generated 🚀"
      );

      setPrompt("");

      setLoading(false);
    };

  return (
    <div className="flex-1 bg-zinc-950 p-8 flex flex-col">

      <h1 className="text-3xl font-bold text-white mb-8">
        AI Project Generator
      </h1>

      <div className="flex gap-4">

        <input
          value={prompt}
          onChange={(e) =>
            setPrompt(e.target.value)
          }

          placeholder="Create modern dashboard app..."

          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white outline-none"
        />

        <button
          onClick={handleGenerate}

          disabled={loading}

          className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg"
        >
          {
            loading
              ? "Generating..."
              : "Generate"
          }
        </button>

      </div>

    </div>
  );
}

export default ChatPanel;