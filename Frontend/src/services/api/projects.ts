import axios from "axios";

import { API_BASE_URL } from "../../config/env";

export const generateProject = async (
  prompt: string
) => {

  const response = await axios.post(
    `${API_BASE_URL}/generate`,
    {
      prompt,
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