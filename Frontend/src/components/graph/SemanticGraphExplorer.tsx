import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import type { Node as RFNode, Edge as RFEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Search,
  Activity,
  Layers,
  ArrowRightLeft,
  X,
  AlertTriangle,
  FolderOpen,
  Info,
  Check,
  ChevronRight,
  Focus,
  BookOpen,
  Folder,
} from 'lucide-react';

import type { SemanticModel, Symbol, ResolvedReference } from './types';
import {
  buildGraph,
  buildModuleGraph,
  buildServiceGraph,
  buildApiGraph,
  buildDataGraph,
  traceFlow
} from './utils/graph-builder';
import { CustomNode, FileGroupNode, ClassGroupNode, getSymbolTheme } from './components/CustomNode';
import { useProjectStore } from '../../store/projectStore';
import { getProjectSemanticModel } from '../../services/api/projects';
import "./SemanticGraphExplorer.css";

const nodeTypes = {
  customNode: CustomNode,
  fileGroup: FileGroupNode,
  classGroup: ClassGroupNode,
};

function LegendSection() {
  return (
    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 16, width: '100%' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' }}>
        Graph Legend
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Symbols (Nodes)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'File', color: '#0ea5e9' },
              { label: 'Class', color: '#a855f7' },
              { label: 'Interface', color: '#ec4899' },
              { label: 'Struct', color: '#14b8a6' },
              { label: 'Function', color: '#10b981' },
              { label: 'Method', color: '#f59e0b' },
              { label: 'Variable', color: '#f43f5e' },
              { label: 'Type Alias', color: '#6366f1' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: item.color }}></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Relations (Edges)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Call (Func/Method)', color: '#10b981', style: 'solid', desc: 'solid flow' },
              { label: 'Instantiate', color: '#f59e0b', style: 'solid', desc: 'solid flow' },
              { label: 'Import', color: '#0ea5e9', style: 'dashed', desc: 'dashed' },
              { label: 'Inherit/Implement', color: '#a855f7', style: 'dotted', desc: 'dotted' },
              { label: 'Containment', color: 'rgba(255, 255, 255, 0.1)', style: 'dashed', desc: 'faint dashed' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                <span>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{item.desc}</span>
                  <div
                    style={{
                      width: 20,
                      height: item.style === 'solid' ? 2 : 0,
                      borderTop: item.style !== 'solid' ? `1px ${item.style} ${item.color}` : 'none',
                      backgroundColor: item.style === 'solid' ? item.color : 'transparent',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SemanticGraphExplorerContent() {
  const { fitView, setCenter } = useReactFlow();
  const { projects } = useProjectStore();

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [model, setModel] = useState<SemanticModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKinds, setSelectedKinds] = useState<Set<string>>(new Set());
  const [selectedEdgeKinds, setSelectedEdgeKinds] = useState<Set<string>>(new Set());

  // Interactive selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [neighborhoodNodeId, setNeighborhoodNodeId] = useState<string | null>(null);

  // View mode selection
  type ViewMode = 'flat' | 'module' | 'service' | 'api' | 'data';
  const [viewMode, setViewMode] = useState<ViewMode>('flat');

  // Active Execution Flow Trace
  const [activeTraceStartId, setActiveTraceStartId] = useState<string | null>(null);
  const [traceDepth, setTraceDepth] = useState<number>(4);

  // Auto-select first project
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].project_name);
    }
  }, [projects, selectedProject]);

  // Load model JSON from backend when selected project changes
  useEffect(() => {
    if (!selectedProject) return;

    setIsLoading(true);
    setError(null);
    setModel(null);
    setSelectedNodeId(null);
    setNeighborhoodNodeId(null);
    setActiveTraceStartId(null);

    getProjectSemanticModel(selectedProject)
      .then((data: SemanticModel) => {
        setModel(data);
        setIsLoading(false);

        // Initialize filters
        const kinds = new Set(data.symbols.map((s) => s.kind));
        kinds.delete('project');
        setSelectedKinds(kinds);

        const edgeKinds = new Set(data.resolvedReferences.map((r) => r.kind));
        setSelectedEdgeKinds(edgeKinds);
      })
      .catch((err) => {
        setError(
          err.response?.data?.detail ||
          "Failed to load semantic model. Make sure MASAI analysis has run and generated a .masai/semantic-model.json file for this project."
        );
        setIsLoading(false);
      });
  }, [selectedProject]);

  // Map representation of symbols for fast lookups
  const symbolMap = useMemo(() => {
    const map = new Map<string, Symbol>();
    if (!model) return map;
    for (const sym of model.symbols) {
      map.set(sym.id, sym);
    }
    return map;
  }, [model]);

  const parentToChildren = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!model) return map;
    for (const c of model.containments) {
      const list = map.get(c.parentId) || [];
      list.push(c.childId);
      map.set(c.parentId, list);
    }
    return map;
  }, [model]);

  const childToParent = useMemo(() => {
    const map = new Map<string, string>();
    if (!model) return map;
    for (const c of model.containments) {
      map.set(c.childId, c.parentId);
    }
    return map;
  }, [model]);

  const referencesTo = useMemo(() => {
    const map = new Map<string, ResolvedReference[]>();
    if (!model) return map;
    for (const ref of model.resolvedReferences) {
      const list = map.get(ref.toSymbolId) || [];
      list.push(ref);
      map.set(ref.toSymbolId, list);
    }
    return map;
  }, [model]);

  const referencesFrom = useMemo(() => {
    const map = new Map<string, ResolvedReference[]>();
    if (!model) return map;
    for (const ref of model.resolvedReferences) {
      const list = map.get(ref.fromSymbolId) || [];
      list.push(ref);
      map.set(ref.fromSymbolId, list);
    }
    return map;
  }, [model]);

  // Counts for filters list
  const counts = useMemo(() => {
    const kindCounts: Record<string, number> = {};
    const edgeCounts: Record<string, number> = {};

    if (model) {
      for (const s of model.symbols) {
        if (s.kind !== 'project') {
          kindCounts[s.kind] = (kindCounts[s.kind] || 0) + 1;
        }
      }
      for (const r of model.resolvedReferences) {
        edgeCounts[r.kind] = (edgeCounts[r.kind] || 0) + 1;
      }
    }

    return { kinds: kindCounts, edges: edgeCounts };
  }, [model]);

  // Translate semantic-model to RF nodes/edges depending on view mode
  const currentGraph = useMemo(() => {
    if (!model) return { nodes: [], edges: [] };

    if (activeTraceStartId) {
      return traceFlow(model, activeTraceStartId, traceDepth);
    }

    switch (viewMode) {
      case 'module':
        return buildModuleGraph(model);
      case 'service':
        return buildServiceGraph(model);
      case 'api':
        return buildApiGraph(model);
      case 'data':
        return buildDataGraph(model);
      case 'flat':
      default:
        return buildGraph(model);
    }
  }, [model, viewMode, activeTraceStartId, traceDepth]);

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([]);

  // Sync graph state on currentGraph change
  useEffect(() => {
    if (currentGraph.nodes.length > 0) {
      setNodes(currentGraph.nodes);
      setEdges(currentGraph.edges);
      setTimeout(() => fitView({ padding: 0.1, duration: 800 }), 50);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [currentGraph, fitView, setNodes, setEdges]);

  // Compute connections in Neighborhood Mode
  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!neighborhoodNodeId || !model) return ids;

    for (const ref of model.resolvedReferences) {
      if (ref.fromSymbolId === neighborhoodNodeId) {
        ids.add(ref.toSymbolId);
      }
      if (ref.toSymbolId === neighborhoodNodeId) {
        ids.add(ref.fromSymbolId);
      }
    }

    const children = parentToChildren.get(neighborhoodNodeId) || [];
    for (const childId of children) {
      ids.add(childId);
    }

    const parentId = childToParent.get(neighborhoodNodeId);
    if (parentId) ids.add(parentId);

    return ids;
  }, [neighborhoodNodeId, model, parentToChildren, childToParent]);

  // Evaluate node visibility based on filters
  const visibleNodesMap = useMemo(() => {
    const visibility = new Map<string, boolean>();
    if (!model || nodes.length === 0) return visibility;

    const nodeMap = new Map<string, RFNode>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    function isNodeVisible(nodeId: string): boolean {
      const cache = visibility.get(nodeId);
      if (cache !== undefined) return cache;

      if (activeTraceStartId) {
        visibility.set(nodeId, true);
        return true;
      }

      const node = nodeMap.get(nodeId);
      if (!node) {
        visibility.set(nodeId, false);
        return false;
      }

      const symbol = (node.data as any).symbol as Symbol;
      if (!symbol) {
        visibility.set(nodeId, false);
        return false;
      }

      if (neighborhoodNodeId) {
        const isSelf = nodeId === neighborhoodNodeId;
        const isNeighbor = connectedNodeIds.has(nodeId);

        if (isSelf || isNeighbor) {
          visibility.set(nodeId, true);
          return true;
        }

        const children = parentToChildren.get(nodeId) || [];
        const hasVisibleChild = children.some((cId) => {
          return cId === neighborhoodNodeId || connectedNodeIds.has(cId);
        });
        if (hasVisibleChild) {
          visibility.set(nodeId, true);
          return true;
        }

        visibility.set(nodeId, false);
        return false;
      }

      const isContainer = symbol.kind === 'file' || symbol.kind === 'class' || symbol.kind === 'interface' || symbol.kind === 'struct';
      if (!isContainer) {
        const matchesSearch =
          symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symbol.qualifiedName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesKind = selectedKinds.has(symbol.kind);
        const active = matchesSearch && matchesKind;
        visibility.set(nodeId, active);
        return active;
      }

      const matchesSelf =
        (symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symbol.qualifiedName.toLowerCase().includes(searchTerm.toLowerCase())) &&
        selectedKinds.has(symbol.kind);

      if (matchesSelf) {
        visibility.set(nodeId, true);
        return true;
      }

      const children = parentToChildren.get(nodeId) || [];
      const hasVisibleChild = children.some((childId) => isNodeVisible(childId));
      visibility.set(nodeId, hasVisibleChild);
      return hasVisibleChild;
    }

    for (const node of nodes) {
      isNodeVisible(node.id);
    }

    return visibility;
  }, [nodes, model, searchTerm, selectedKinds, neighborhoodNodeId, connectedNodeIds, parentToChildren, symbolMap, activeTraceStartId]);

  const displayNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      hidden: !visibleNodesMap.get(node.id),
      selected: node.id === selectedNodeId,
    }));
  }, [nodes, visibleNodesMap, selectedNodeId]);

  const displayEdges = useMemo(() => {
    return edges.map((edge) => {
      const sourceVisible = visibleNodesMap.get(edge.source);
      const targetVisible = visibleNodesMap.get(edge.target);
      const edgeFilterMatch = selectedEdgeKinds.has(edge.label as string);
      const isHidden = !sourceVisible || !targetVisible || !edgeFilterMatch;

      return {
        ...edge,
        hidden: isHidden,
      };
    });
  }, [edges, visibleNodesMap, selectedEdgeKinds]);

  const selectAndFocusNode = useCallback(
    (id: string) => {
      setSelectedNodeId(id);
      const node = nodes.find((n) => n.id === id);
      if (node) {
        let x = node.position.x;
        let y = node.position.y;
        let currentParentId = node.parentId;

        while (currentParentId) {
          const parentNode = nodes.find((n) => n.id === currentParentId);
          if (parentNode) {
            x += parentNode.position.x;
            y += parentNode.position.y;
            currentParentId = parentNode.parentId;
          } else {
            break;
          }
        }

        setCenter(x + 90, y + 20, { zoom: 1.25, duration: 800 });
      }
    },
    [nodes, setCenter],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: RFNode) => {
      setSelectedNodeId(node.id);
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const toggleKindFilter = (kind: string) => {
    const next = new Set(selectedKinds);
    if (next.has(kind)) {
      next.delete(kind);
    } else {
      next.add(kind);
    }
    setSelectedKinds(next);
  };

  const toggleEdgeFilter = (kind: string) => {
    const next = new Set(selectedEdgeKinds);
    if (next.has(kind)) {
      next.delete(kind);
    } else {
      next.add(kind);
    }
    setSelectedEdgeKinds(next);
  };

  const selectedSymbol = useMemo(() => {
    if (!selectedNodeId) return null;
    const activeNode = nodes.find(n => n.id === selectedNodeId);
    if (activeNode && (activeNode.data as any)?.symbol) {
      return (activeNode.data as any).symbol as Symbol;
    }
    return symbolMap.get(selectedNodeId) || null;
  }, [selectedNodeId, nodes, symbolMap]);

  const selectedRelations = useMemo(() => {
    if (!selectedNodeId) return null;

    const from = referencesFrom.get(selectedNodeId) || [];
    const to = referencesTo.get(selectedNodeId) || [];

    return {
      referencesMade: from.map((ref) => ({
        ref,
        targetSymbol: symbolMap.get(ref.toSymbolId)!,
      })).filter(item => item.targetSymbol !== undefined),
      referencesReceived: to.map((ref) => ({
        ref,
        sourceSymbol: symbolMap.get(ref.fromSymbolId)!,
      })).filter(item => item.sourceSymbol !== undefined),
    };
  }, [selectedNodeId, referencesFrom, referencesTo, symbolMap]);

  return (
    <div className="semantic-graph-page">
      {/* LEFT SIDEBAR: Project Selector, Search, Filters & Stats */}
      <aside className="sidebar">
        <div className="sidebar-header">
          {/* Project selector drop down */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider flex items-center gap-1">
              <Folder size={10} /> Select Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-600 w-full"
            >
              <option value="" disabled>-- Select a Project --</option>
              {projects.map((proj) => (
                <option key={proj.project_name} value={proj.project_name}>
                  {proj.project_name}
                </option>
              ))}
            </select>
          </div>

          <h1>
            <Activity size={15} color="#3b82f6" />
            <span>MASAI Knowledge Graph</span>
          </h1>

          <div className="view-selector-tabs">
            {(['flat', 'module', 'service', 'api', 'data'] as const).map((mode) => (
              <button
                key={mode}
                className={`view-tab-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => {
                  setViewMode(mode);
                  setActiveTraceStartId(null);
                  setSelectedNodeId(null);
                }}
              >
                {mode === 'flat' ? 'Flat' : mode === 'module' ? 'Modules' : mode === 'service' ? 'Services' : mode === 'api' ? 'APIs' : 'Data'}
              </button>
            ))}
          </div>

          <div className="search-container">
            <Search className="search-icon" size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search symbols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="sidebar-content">
          {isLoading && (
            <div className="text-zinc-500 text-xs py-4 text-center">Loading model statistics...</div>
          )}

          {!isLoading && model && (
            <>
              {/* Stats widget */}
              <div className="section-card">
                <div className="section-title">
                  <span>Workspace Stats</span>
                  <Activity size={12} color="var(--text-muted)" />
                </div>
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-val">{model.fileCount || 0}</div>
                    <div className="stat-label">Files</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-val">{model.symbolCount || 0}</div>
                    <div className="stat-label">Symbols</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-val">{model.resolvedReferences?.length || 0}</div>
                    <div className="stat-label">Resolved Refs</div>
                  </div>
                  <div className="stat-box" style={{ borderColor: model.diagnostics?.length > 0 ? '#f59e0b' : 'var(--border-color)' }}>
                    <div className="stat-val" style={{ color: model.diagnostics?.length > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
                      {model.diagnostics?.length || 0}
                    </div>
                    <div className="stat-label">Diagnostics</div>
                  </div>
                </div>
              </div>

              {/* Symbol Filter Badges */}
              <div className="section-card">
                <div className="section-title">
                  <span>Filter Symbols</span>
                  <Layers size={12} color="var(--text-muted)" />
                </div>
                <div className="filters-list">
                  {Object.entries(counts.kinds).map(([kind, count]) => {
                    const { color } = getSymbolTheme(kind);
                    const isChecked = selectedKinds.has(kind);
                    return (
                      <div key={kind} className="filter-item" onClick={() => toggleKindFilter(kind)}>
                        <div className="filter-label">
                          <div className={`checkbox-custom ${isChecked ? 'checked' : ''}`}>
                            {isChecked && <Check size={8} color="white" />}
                          </div>
                          <div className="dot-indicator" style={{ backgroundColor: color }}></div>
                          <span style={{ textTransform: 'capitalize' }}>{kind.replace('_', ' ')}s</span>
                        </div>
                        <div className="count-badge">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Edge Filter Badges */}
              <div className="section-card">
                <div className="section-title">
                  <span>Filter Relations</span>
                  <ArrowRightLeft size={12} color="var(--text-muted)" />
                </div>
                <div className="filters-list">
                  {Object.entries(counts.edges).map(([kind, count]) => {
                    const isChecked = selectedEdgeKinds.has(kind);
                    return (
                      <div key={kind} className="filter-item" onClick={() => toggleEdgeFilter(kind)}>
                        <div className="filter-label">
                          <div className={`checkbox-custom ${isChecked ? 'checked' : ''}`}>
                            {isChecked && <Check size={8} color="white" />}
                          </div>
                          <span style={{ textTransform: 'capitalize' }}>{kind.replace('_', ' ')}</span>
                        </div>
                        <div className="count-badge">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diagnostics warning panel */}
              {model.diagnostics && model.diagnostics.length > 0 && (
                <div className="section-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                  <div className="section-title" style={{ color: '#f59e0b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} />
                      Diagnostics ({model.diagnostics.length})
                    </span>
                  </div>
                  <div className="file-list" style={{ gap: 8 }}>
                    {model.diagnostics.map((diag, index) => (
                      <div key={index} className={`diagnostic-item ${diag.severity}`}>
                        <div className="diagnostic-header">
                          <span>{diag.kind.replace('_', ' ')}</span>
                          <span style={{ fontSize: 8, textTransform: 'uppercase', opacity: 0.8 }}>{diag.severity}</span>
                        </div>
                        <div className="diagnostic-msg">{diag.message}</div>
                        <div className="diagnostic-path">{diag.filePath}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick File Navigator */}
              <div className="section-card">
                <div className="section-title">
                  <span>Codebase Files</span>
                  <FolderOpen size={12} color="var(--text-muted)" />
                </div>
                <div className="file-list">
                  {model.symbols
                    .filter((s) => s.kind === 'file')
                    .map((file) => (
                      <div key={file.id} className="file-item" onClick={() => selectAndFocusNode(file.id)}>
                        <ChevronRight size={10} color="var(--text-muted)" />
                        <span>{file.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* CENTER: React Flow Canvas */}
      <main className="canvas-container">
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <div className="loading-text">Loading {selectedProject} Knowledge Graph...</div>
          </div>
        )}

        {error && (
          <div className="loading-overlay">
            <AlertTriangle size={36} color="#ef4444" />
            <div className="loading-text" style={{ color: '#ef4444', marginTop: 10, maxWidth: '80%', textAlign: 'center', lineHeight: 1.5 }}>
              {error}
            </div>
          </div>
        )}

        {!selectedProject && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-sm gap-2">
            <FolderOpen size={24} />
            Please select a project from the left dropdown.
          </div>
        )}

        {!isLoading && !error && model && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
            Semantic Graph is empty. Ensure MASAI analysis has completed successfully.
          </div>
        )}

        {activeTraceStartId && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 5,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '16px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11.5,
              color: '#a7f3d0',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.35)',
            }}
          >
            <Activity size={12} color="#10b981" />
            <span>
              Flow Trace (Depth: <strong>{traceDepth}</strong>)
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setTraceDepth(d => d + 2)}
                className="action-btn"
                style={{ width: 'auto', padding: '1px 6px', fontSize: 10, background: 'rgba(255,255,255,0.1)' }}
              >
                +2
              </button>
              <button
                onClick={() => setTraceDepth(d => Math.max(2, d - 2))}
                className="action-btn"
                style={{ width: 'auto', padding: '1px 6px', fontSize: 10, background: 'rgba(255,255,255,0.1)' }}
              >
                -2
              </button>
              <button
                onClick={() => {
                  setActiveTraceStartId(null);
                  setTraceDepth(4);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  marginLeft: 2,
                }}
              >
                <X size={8} />
              </button>
            </div>
          </div>
        )}

        {neighborhoodNodeId && (
          <div
            style={{
              position: 'absolute',
              top: activeTraceStartId ? 50 : 16,
              left: 16,
              zIndex: 5,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid #3b82f6',
              borderRadius: '16px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: '#93c5fd',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span>Neighborhood isolation active</span>
            <button
              onClick={() => setNeighborhoodNodeId(null)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: 14,
                height: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <X size={8} />
            </button>
          </div>
        )}

        {!isLoading && !error && model && nodes.length > 0 && (
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            minZoom={0.05}
            maxZoom={2}
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6 }} />
            <MiniMap
              style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6 }}
              nodeStrokeColor={(n) => {
                if (n.type === 'fileGroup') return '#0ea5e9';
                if (n.type === 'classGroup') return '#a855f7';
                return '#3b82f6';
              }}
              nodeColor={(n) => {
                if (n.type === 'fileGroup') return 'rgba(14, 165, 233, 0.05)';
                if (n.type === 'classGroup') return 'rgba(168, 85, 247, 0.05)';
                return '#18181b';
              }}
            />
          </ReactFlow>
        )}
      </main>

      {/* RIGHT SIDEBAR: Symbol Details / Inspector */}
      <aside className="sidebar right">
        {!isLoading && model && (
          <>
            {selectedSymbol ? (
              <>
                <div className="sidebar-header">
                  <div className="inspector-title-area">
                    <div
                      className="inspector-kind-badge"
                      style={{ backgroundColor: getSymbolTheme(selectedSymbol.kind).color }}
                    >
                      {selectedSymbol.kind}
                    </div>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="inspector-name">{selectedSymbol.name}</div>
                  <div className="inspector-qname">{selectedSymbol.qualifiedName}</div>
                </div>

                <div className="sidebar-content">
                  {/* Properties Panel */}
                  <div className="section-card">
                    <div className="section-title">
                      <span>Symbol Details</span>
                      <Info size={12} color="var(--text-muted)" />
                    </div>
                    <div className="inspector-meta-row">
                      <span className="inspector-meta-label">File Location</span>
                      <span className="inspector-meta-val" title={selectedSymbol.filePath}>{selectedSymbol.filePath}</span>
                    </div>
                    <div className="inspector-meta-row">
                      <span className="inspector-meta-label">Visibility</span>
                      <span className="inspector-meta-val" style={{ textTransform: 'capitalize' }}>
                        {selectedSymbol.visibility}
                      </span>
                    </div>
                    <div className="inspector-meta-row">
                      <span className="inspector-meta-label">Exported</span>
                      <span className="inspector-meta-val">{selectedSymbol.exported ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="inspector-meta-row">
                      <span className="inspector-meta-label">Source Range</span>
                      <span className="inspector-meta-val" style={{ fontFamily: 'monospace' }}>
                        L{selectedSymbol.range?.start?.line + 1 || 1} - L{selectedSymbol.range?.end?.line + 1 || 1}
                      </span>
                    </div>

                    {Object.entries(selectedSymbol.metadata || {}).map(([key, val]) => {
                      if (typeof val === 'object') return null;
                      return (
                        <div className="inspector-meta-row" key={key}>
                          <span className="inspector-meta-label" style={{ textTransform: 'capitalize' }}>{key}</span>
                          <span className="inspector-meta-val">{String(val)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="action-btn" onClick={() => selectAndFocusNode(selectedSymbol.id)}>
                        <Focus size={14} />
                        Focus
                      </button>
                      <button
                        className={`action-btn secondary ${neighborhoodNodeId === selectedSymbol.id ? 'active' : ''}`}
                        onClick={() =>
                          setNeighborhoodNodeId(neighborhoodNodeId === selectedSymbol.id ? null : selectedSymbol.id)
                        }
                      >
                        <BookOpen size={14} />
                        Neighborhood
                      </button>
                    </div>

                    <button
                      className="action-btn"
                      onClick={() => {
                        if (activeTraceStartId === selectedSymbol.id) {
                          setActiveTraceStartId(null);
                        } else {
                          setActiveTraceStartId(selectedSymbol.id);
                          setTraceDepth(4);
                        }
                      }}
                      style={{
                        backgroundColor: activeTraceStartId === selectedSymbol.id ? '#ef4444' : '#10b981',
                        color: 'white',
                      }}
                    >
                      <Activity size={14} />
                      {activeTraceStartId === selectedSymbol.id ? 'Stop Flow Trace' : 'Trace Flow'}
                    </button>
                  </div>

                  {/* References Panel */}
                  {selectedRelations && (
                    <>
                      <div className="section-card">
                        <div className="section-title">
                          <span>Incoming Relations ({selectedRelations.referencesReceived.length})</span>
                          <ArrowRightLeft size={12} color="var(--text-muted)" />
                        </div>
                        {selectedRelations.referencesReceived.length > 0 ? (
                          <div className="inspector-relations-list">
                            {selectedRelations.referencesReceived.map(({ ref, sourceSymbol }) => (
                              <div
                                key={ref.candidateId}
                                className="inspector-relation-card"
                                onClick={() => selectAndFocusNode(sourceSymbol.id)}
                              >
                                <span className="relation-name">{sourceSymbol.name}</span>
                                <span className="relation-meta">{ref.kind}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 4 }}>
                            No incoming references.
                          </div>
                        )}
                      </div>

                      <div className="section-card">
                        <div className="section-title">
                          <span>Outgoing Relations ({selectedRelations.referencesMade.length})</span>
                          <ArrowRightLeft size={12} color="var(--text-muted)" />
                        </div>
                        {selectedRelations.referencesMade.length > 0 ? (
                          <div className="inspector-relations-list">
                            {selectedRelations.referencesMade.map(({ ref, targetSymbol }) => (
                              <div
                                key={ref.candidateId}
                                className="inspector-relation-card"
                                onClick={() => selectAndFocusNode(targetSymbol.id)}
                              >
                                <span className="relation-name">{targetSymbol.name}</span>
                                <span className="relation-meta">{ref.kind}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 4 }}>
                            No outgoing references.
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <LegendSection />
                </div>
              </>
            ) : (
              <div className="inspector-empty">
                <Info size={30} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 13, fontWeight: 700 }}>Symbol Inspector</h3>
                  <p style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                    Click a node on the canvas, or click in the file navigator, to inspect code structure and references.
                  </p>
                </div>
                <LegendSection />
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

export default function SemanticGraphExplorer() {
  return (
    <ReactFlowProvider>
      <SemanticGraphExplorerContent />
    </ReactFlowProvider>
  );
}
