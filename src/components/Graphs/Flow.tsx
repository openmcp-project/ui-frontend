import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

const nodeWidth = 200;
const nodeHeight = 80;

const sourceColors: Record<string, string> = {
  'gitops-btp': '#28a745',
  'gitops-btp-source': '#f0ad4e',
  'gitops-btp-source-two': '#f06e4e',
  'gitops-ias-argo-source': '#e67aff',
};

type TreeNodeData = {
  id: string;
  label: string;
  parentId?: string;
  type?: string;
  source?: string;
  status?: 'ok' | 'error';
};

const data: TreeNodeData[] = [
  { id: '1', label: 'GlobalAccount', source: 'gitops-btp-source' },
  { id: '2', label: 'Subaccount', parentId: '1', source: 'gitops-btp-source' },
  {
    id: '3',
    label: 'Entitlement A',
    parentId: '2',
    source: 'gitops-argo-source',
  },
  {
    id: '4',
    label: 'Entitlement B',
    parentId: '2',
    source: 'gitops-argo-source',
    status: 'error',
  },
  { id: '5', label: 'GlobalAccount 2', source: 'gitops-ias-argo-source' },
  {
    id: '6',
    label: 'Subaccount 2',
    parentId: '5',
    source: 'gitops-ias-argo-source',
  },
  { id: '7', label: 'App A', parentId: '6', source: 'gitops-btp-source-two' },
  { id: '8', label: 'App B', parentId: '6', source: 'gitops-btp-source-two' },
];

const createGraphLayout = (
  nodeData: TreeNodeData[],
): { nodes: Node[]; edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB' });

  const nodes: Node[] = nodeData.map((n) => {
    const color = sourceColors[n.source || ''] || '#ccc';
    const node: Node = {
      id: n.id,
      data: {
        label: n.label,
        type: n.type,
        source: n.source,
        status: n.status,
      },
      style: {
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fff',
        boxShadow: n.status === 'error' ? '0 0 0 2px red inset' : '',
      },
      width: nodeWidth,
      height: nodeHeight,
      position: { x: 0, y: 0 },
    };

    dagreGraph.setNode(n.id, { width: nodeWidth, height: nodeHeight });

    return node;
  });

  const edges: Edge[] = nodeData
    .filter((n) => n.parentId)
    .map((n) => {
      dagreGraph.setEdge(n.parentId!, n.id);
      return {
        id: `e-${n.parentId}-${n.id}`,
        source: n.parentId!,
        target: n.id,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
    });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    node.position = {
      x: pos.x - nodeWidth / 2,
      y: pos.y - nodeHeight / 2,
    };
    node.sourcePosition = Position.Bottom;
    node.targetPosition = Position.Top;
  });

  return { nodes, edges };
};

const Legend = ({ sources }: { sources: string[] }) => (
  <div
    style={{
      padding: '1rem',
      minWidth: 240,
      maxWidth: 300,
      maxHeight: 280,
      border: '1px solid #ccc',
      borderRadius: 8,
      backgroundColor: '#fff',
      margin: '1rem',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
      overflow: 'auto',
      alignSelf: 'flex-start',
    }}
  >
    <h4 style={{ marginBottom: 10 }}>Legenda:</h4>
    {sources.map((source) => (
      <div
        key={source}
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            backgroundColor: sourceColors[source],
            marginRight: 8,
            borderRadius: 3,
            border: '1px solid #999',
          }}
        />
        <span>{source}</span>
      </div>
    ))}
  </div>
);

const Flow: React.FC = () => {
  const { nodes: layoutedNodes, edges: layoutedEdges } =
    createGraphLayout(data);
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '600px',
        border: '1px solid #ddd',
        borderRadius: 8,
        overflow: 'hidden',
        fontFamily: 'sans-serif',
        backgroundColor: '#fafafa',
      }}
    >
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={true}
          panOnDrag={true}
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <Legend sources={Object.keys(sourceColors)} />
    </div>
  );
};

export default Flow;
