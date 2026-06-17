// import axios from "axios";

// import { API_BASE_URL } from "../../config/env";

// export const generateProject = async (
//   prompt: string
// ) => {

//   const response = await axios.post(
//     `${API_BASE_URL}/generate`,
//     {
//       prompt,
//     }
//   );

//   return response.data;
// };

// export const getProjects = async () => {

//   const response = await axios.get(
//     `${API_BASE_URL}/projects`
//   );

//   return response.data;
// };
import axios from "axios";
import { API_BASE_URL } from "../../config/env";

export const generateProject = async (
  prompt: string,
  projectName?: string,
  geminiApiKey?: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/agents/run`,
    {
      prompt,
      project_name: projectName,
      gemini_api_key: geminiApiKey,
      agent_id: "orchestrator",
    }
  );

  return response.data;
};

export const getProjects = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/projects`
  );

  return response.data;
};

export const getProjectSemanticModel = async (projectName: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/projects/${projectName}/semantic-model`
  );
  return response.data;
};