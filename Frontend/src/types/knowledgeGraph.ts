export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GraphEdge {
  id: string;
  source_id: string;
  target_id: string;
  relationship: string;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface GraphStats {
  node_count: number;
  edge_count: number;
  node_types: Record<string, number>;
  relationships: Record<string, number>;
}

export interface FullGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  node_count: number;
  edge_count: number;
}

export interface NeighborEntry {
  edge: GraphEdge;
  node: GraphNode;
  direction: "in" | "out";
}

export interface ForceGraphNode {
  id: string;
  name: string;
  type: string;
  val: number;
  color: string;
}

export interface ForceGraphLink {
  source: string;
  target: string;
  relationship: string;
}
