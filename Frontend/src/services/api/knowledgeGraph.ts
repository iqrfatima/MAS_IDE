import axios from "axios";

import { API_BASE_URL } from "../../config/env";

import type {
  FullGraph,
  GraphEdge,
  GraphNode,
  GraphStats,
  NeighborEntry,
} from "../../types/knowledgeGraph";

export const getGraphStats = async (): Promise<GraphStats> => {
  const response = await axios.get(
    `${API_BASE_URL}/knowledge-graph/stats`
  );

  return response.data.stats;
};

export const getFullGraph = async (
  limit = 500
): Promise<FullGraph> => {
  const response = await axios.get(
    `${API_BASE_URL}/knowledge-graph`,
    { params: { limit } }
  );

  return response.data.graph;
};

export const searchGraphNodes = async (
  query: string,
  type?: string
): Promise<GraphNode[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/knowledge-graph/nodes/search`,
    {
      params: {
        q: query,
        type,
      },
    }
  );

  return response.data.nodes;
};

export const getGraphNode = async (
  nodeId: string
): Promise<GraphNode> => {
  const response = await axios.get(
    `${API_BASE_URL}/knowledge-graph/nodes/${nodeId}`
  );

  return response.data.node;
};

export const getNodeNeighbors = async (
  nodeId: string
): Promise<NeighborEntry[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/knowledge-graph/nodes/${nodeId}/neighbors`
  );

  return response.data.neighbors;
};

export const getNodeSubgraph = async (
  nodeId: string,
  depth = 2
): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
}> => {
  const response = await axios.post(
    `${API_BASE_URL}/knowledge-graph/nodes/${nodeId}/subgraph`,
    { depth }
  );

  return response.data.subgraph;
};
