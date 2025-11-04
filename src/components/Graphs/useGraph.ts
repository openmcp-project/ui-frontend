import { useMemo, useEffect, useState } from 'react';
import { useApiResource, useProvidersConfigResource } from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../lib/shared/constants';
import { Node, Edge, Position } from '@xyflow/react';
import dagre from 'dagre';
import { NodeData, ColorBy } from './types';
import { buildTreeData, generateColorMap } from './graphUtils';
import { ManagedResourceItem } from '../../lib/shared/types';

const nodeWidth = 250;
const nodeHeight = 60;

function buildGraph(
  treeData: NodeData[],
  colorBy: ColorBy,
  colorMap: Record<string, string>,
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB' });

  const nodeMap = new Map<string, Node<NodeData>>();
  treeData.forEach((n) => {
    const colorKey: string =
      colorBy === 'source' ? n.providerType : colorBy === 'flux' ? (n.fluxName ?? 'default') : n.providerConfigName;
    const borderColor = colorMap[colorKey] || '#ccc';
    // 8% opacity for background
    const backgroundColor = `${borderColor}08`;

    const node: Node<NodeData> = {
      id: n.id,
      type: 'custom',
      data: { ...n },
      style: {
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        backgroundColor,
        width: nodeWidth,
        height: nodeHeight,
      },
      width: nodeWidth,
      height: nodeHeight,
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    nodeMap.set(n.id, node);
    dagreGraph.setNode(n.id, { width: nodeWidth, height: nodeHeight });
  });

  const edgeList: Edge[] = [];
  treeData.forEach((n) => {
    if (n.parentId) {
      dagreGraph.setEdge(n.parentId, n.id);
      edgeList.push({
        id: `e-${n.parentId}-${n.id}`,
        source: n.parentId,
        target: n.id,
        style: { strokeWidth: 2, stroke: '#888' },
      });
    }
    n.extraRefs?.forEach((refId) => {
      if (nodeMap.has(refId)) {
        dagreGraph.setEdge(refId, n.id);
        edgeList.push({
          id: `e-${refId}-${n.id}`,
          source: refId,
          target: n.id,
          style: { strokeWidth: 2, stroke: '#888' },
        });
      }
    });
  });

  dagre.layout(dagreGraph);
  nodeMap.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    node.position = { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 };
  });

  return { nodes: Array.from(nodeMap.values()), edges: edgeList };
}

export function useGraph(colorBy: ColorBy, onYamlClick: (item: ManagedResourceItem) => void) {
  const {
    data: managedResources,
    isLoading: managedResourcesLoading,
    error: managedResourcesError,
  } = useApiResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval,
  });
  const {
    data: providerConfigsList,
    isLoading: providerConfigsLoading,
    error: providerConfigsError,
  } = useProvidersConfigResource({
    refreshInterval: resourcesInterval,
  });

  const loading = managedResourcesLoading || providerConfigsLoading;
  const error = managedResourcesError || providerConfigsError;

  const treeData = useMemo(
    () => buildTreeData(managedResources, providerConfigsList, onYamlClick),
    [managedResources, providerConfigsList, onYamlClick],
  );

  const colorMap = useMemo(() => generateColorMap(treeData, colorBy), [treeData, colorBy]);

  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!treeData.length) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const { nodes, edges } = buildGraph(treeData, colorBy, colorMap);
    setNodes(nodes);
    setEdges(edges);
  }, [treeData, colorBy, colorMap]);

  return { nodes, edges, colorMap, loading, error };
}
