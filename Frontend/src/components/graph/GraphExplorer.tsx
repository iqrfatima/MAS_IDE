import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-2d";

import {
  RefreshCw,
  Search,
} from "lucide-react";

import {
  getFullGraph,
  getGraphStats,
  getNodeNeighbors,
  searchGraphNodes,
} from "../../services/api/knowledgeGraph";

import type {
  ForceGraphLink,
  ForceGraphNode,
  GraphEdge,
  GraphNode,
  GraphStats,
  NeighborEntry,
} from "../../types/knowledgeGraph";

const NODE_COLORS: Record<string, string> = {
  project: "#3b82f6",
  file: "#22c55e",
  person: "#a855f7",
  component: "#f59e0b",
  technology: "#06b6d4",
  entity: "#71717a",
};

const NODE_SIZES: Record<string, number> = {
  project: 8,
  file: 5,
  person: 6,
  component: 6,
  technology: 5,
  entity: 4,
};

function nodeColor(type: string): string {
  return NODE_COLORS[type] ?? NODE_COLORS.entity;
}

function nodeSize(type: string): number {
  return NODE_SIZES[type] ?? NODE_SIZES.entity;
}

function toForceNodes(
  nodes: GraphNode[]
): ForceGraphNode[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.label,
    type: node.type,
    val: nodeSize(node.type),
    color: nodeColor(node.type),
  }));
}

function toForceLinks(
  edges: GraphEdge[]
): ForceGraphLink[] {
  return edges.map((edge) => ({
    source: edge.source_id,
    target: edge.target_id,
    relationship: edge.relationship,
  }));
}

function GraphExplorer() {

  const graphRef =
    useRef<ForceGraphMethods<
      NodeObject<ForceGraphNode>,
      LinkObject<ForceGraphNode, ForceGraphLink>
    > | undefined>(undefined);

  const containerRef =
    useRef<HTMLDivElement>(null);

  const [stats, setStats] =
    useState<GraphStats | null>(null);

  const [nodes, setNodes] =
    useState<GraphNode[]>([]);

  const [edges, setEdges] =
    useState<GraphEdge[]>([]);

  const [selectedNode, setSelectedNode] =
    useState<GraphNode | null>(null);

  const [neighbors, setNeighbors] =
    useState<NeighborEntry[]>([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<GraphNode[]>([]);

  const [typeFilter, setTypeFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [dimensions, setDimensions] =
    useState({ width: 800, height: 600 });

  const graphData = useMemo(
    () => ({
      nodes: toForceNodes(nodes),
      links: toForceLinks(edges),
    }),
    [nodes, edges]
  );

  const loadGraph = useCallback(
    async () => {

      setLoading(true);
      setError(null);

      try {
        const [graph, graphStats] =
          await Promise.all([
            getFullGraph(),
            getGraphStats(),
          ]);

        setNodes(graph.nodes);
        setEdges(graph.edges);
        setStats(graphStats);
      } catch {
        setError(
          "Failed to load knowledge graph. Is the backend running?"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const selectNode = useCallback(
    async (node: GraphNode) => {

      setSelectedNode(node);

      try {
        const neighborData =
          await getNodeNeighbors(node.id);

        setNeighbors(neighborData);
      } catch {
        setNeighbors([]);
      }

      graphRef.current?.centerAt(
        undefined,
        undefined,
        400
      );

      graphRef.current?.zoom(2, 400);
    },
    []
  );

  const handleSearch = useCallback(
    async () => {

      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const results =
          await searchGraphNodes(
            searchQuery.trim(),
            typeFilter || undefined
          );

        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    },
    [searchQuery, typeFilter]
  );

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  useEffect(() => {

    const element = containerRef.current;

    if (!element) return;

    const observer = new ResizeObserver(
      (entries) => {

        const entry = entries[0];

        if (!entry) return;

        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const nodeTypes = stats
    ? Object.keys(stats.node_types)
    : [];

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">

      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">

        <div>
          <h1 className="text-xl font-bold text-white">
            Knowledge Graph
          </h1>

          {stats && (
            <p className="text-zinc-500 text-sm mt-1">
              {stats.node_count} nodes ·{" "}
              {stats.edge_count} edges
            </p>
          )}
        </div>

        <button
          onClick={loadGraph}
          disabled={loading}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg text-sm"
        >
          <RefreshCw
            size={14}
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>

      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        <div className="w-72 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col gap-4 overflow-y-auto">

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wide">
              Search nodes
            </label>

            <div className="flex gap-2 mt-2">
              <input
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Project, file, label..."
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
              />

              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
              >
                <Search size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wide">
              Filter by type
            </label>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              className="w-full mt-2 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
            >
              <option value="">
                All types
              </option>

              {nodeTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type} (
                  {stats?.node_types[type]}
                  )
                </option>
              ))}
            </select>
          </div>

          {searchResults.length > 0 && (
            <div>
              <h3 className="text-white text-sm font-medium mb-2">
                Search results
              </h3>

              <div className="space-y-1">
                {searchResults.map((node) => (
                  <button
                    key={node.id}
                    onClick={() =>
                      selectNode(node)
                    }
                    className="w-full text-left px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2"
                      style={{
                        backgroundColor:
                          nodeColor(node.type),
                      }}
                    />
                    <span className="text-white">
                      {node.label}
                    </span>
                    <span className="text-zinc-500 ml-2 text-xs">
                      {node.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stats && (
            <div>
              <h3 className="text-white text-sm font-medium mb-2">
                Relationships
              </h3>

              <div className="space-y-1 text-xs text-zinc-400">
                {Object.entries(
                  stats.relationships
                ).map(([rel, count]) => (
                  <div
                    key={rel}
                    className="flex justify-between"
                  >
                    <span>{rel}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-white text-sm font-medium mb-2">
              Legend
            </h3>

            <div className="space-y-1 text-xs">
              {Object.entries(NODE_COLORS).map(
                ([type, color]) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 text-zinc-400"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: color,
                      }}
                    />
                    {type}
                  </div>
                )
              )}
            </div>
          </div>

        </div>

        <div
          ref={containerRef}
          className="flex-1 relative bg-zinc-950"
        >
          {!loading && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
              No graph data yet. Generate a project to populate the graph.
            </div>
          )}

          {nodes.length > 0 && (
            <ForceGraph2D
              ref={graphRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel={(node) => {
                const n =
                  node as ForceGraphNode;

                return `${n.name} (${n.type})`;
              }}
              nodeColor={(node) => {
                const n =
                  node as ForceGraphNode;

                return n.color;
              }}
              nodeVal={(node) => {
                const n =
                  node as ForceGraphNode;

                return n.val;
              }}
              linkLabel={(link) => {
                const l =
                  link as ForceGraphLink;

                return l.relationship;
              }}
              linkColor={() =>
                "rgba(113, 113, 122, 0.5)"
              }
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              onNodeClick={(node) => {
                const graphNode =
                  nodes.find(
                    (n) =>
                      n.id ===
                      (node as ForceGraphNode).id
                  );

                if (graphNode) {
                  selectNode(graphNode);
                }
              }}
              backgroundColor="#09090b"
            />
          )}
        </div>

        <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-4 overflow-y-auto">

          <h2 className="text-white font-semibold mb-4">
            Node details
          </h2>

          {!selectedNode && (
            <p className="text-zinc-500 text-sm">
              Click a node in the graph or search results to inspect it.
            </p>
          )}

          {selectedNode && (
            <div className="space-y-4">

              <div>
                <div
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
                  style={{
                    backgroundColor: `${nodeColor(selectedNode.type)}33`,
                    color: nodeColor(
                      selectedNode.type
                    ),
                  }}
                >
                  {selectedNode.type}
                </div>

                <h3 className="text-white font-medium text-lg">
                  {selectedNode.label}
                </h3>

                <p className="text-zinc-500 text-xs mt-1 font-mono break-all">
                  {selectedNode.id}
                </p>
              </div>

              {Object.keys(
                selectedNode.properties
              ).length > 0 && (
                <div>
                  <h4 className="text-zinc-400 text-xs uppercase tracking-wide mb-2">
                    Properties
                  </h4>

                  <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto">
                    {JSON.stringify(
                      selectedNode.properties,
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              <div>
                <h4 className="text-zinc-400 text-xs uppercase tracking-wide mb-2">
                  Relationships (
                  {neighbors.length})
                </h4>

                {neighbors.length === 0 && (
                  <p className="text-zinc-500 text-sm">
                    No connected nodes.
                  </p>
                )}

                <div className="space-y-2">
                  {neighbors.map((entry) => (
                    <button
                      key={entry.edge.id}
                      onClick={() =>
                        selectNode(entry.node)
                      }
                      className="w-full text-left bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 text-sm"
                    >
                      <div className="text-zinc-400 text-xs mb-1">
                        {entry.direction === "out"
                          ? `→ ${entry.edge.relationship}`
                          : `← ${entry.edge.relationship}`}
                      </div>

                      <div className="text-white">
                        {entry.node.label}
                      </div>

                      <div className="text-zinc-500 text-xs">
                        {entry.node.type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default GraphExplorer;
