import { useMemo, useEffect, useState } from 'react';
import { useApiResource, useProvidersConfigResource } from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../lib/shared/constants';
import { Node, Edge, Position, MarkerType } from '@xyflow/react';
import dagre from 'dagre';
import { NodeData, ManagedResourceGroup, ManagedResourceItem } from './types';
import { extractRefs, generateColorMap, getStatusFromConditions, resolveProviderType } from './graphUtils';

const nodeWidth = 250;
const nodeHeight = 60;

function buildGraph(
  treeData: NodeData[],
  colorBy: 'provider' | 'source',
  colorMap: Record<string, string>,
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB' });

  const nodeMap: Record<string, Node<NodeData>> = {};
  treeData.forEach((n) => {
    const colorKey = colorBy === 'source' ? n.providerType : n.providerConfigName;
    const node: Node<NodeData> = {
      id: n.id,
      type: 'custom',
      data: { ...n },
      style: {
        border: `2px solid ${colorMap[colorKey] || '#ccc'}`,
        borderRadius: 8,
        backgroundColor: '#fff',
        width: nodeWidth,
        height: nodeHeight,
      },
      width: nodeWidth,
      height: nodeHeight,
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    nodeMap[n.id] = node;
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
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    }
    n.extraRefs?.forEach((refId) => {
      if (nodeMap[refId]) {
        dagreGraph.setEdge(refId, n.id);
        edgeList.push({
          id: `e-${refId}-${n.id}`,
          source: refId,
          target: n.id,
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
    });
  });

  dagre.layout(dagreGraph);
  Object.values(nodeMap).forEach((node) => {
    const pos = dagreGraph.node(node.id);
    node.position = { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 };
  });

  return { nodes: Object.values(nodeMap), edges: edgeList };
}

export function useGraph(colorBy: 'provider' | 'source', onYamlClick: (item: ManagedResourceItem) => void) {
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

  const treeData = useMemo(() => {
    if (!managedResources || !providerConfigsList) return [];
    const allNodesMap = new Map<string, NodeData>();
    managedResources.forEach((group: ManagedResourceGroup) => {
      group.items?.forEach((item: ManagedResourceItem) => {
        const id = item?.metadata?.name;
        const kind = item?.kind;
        const providerConfigName = item?.spec?.providerConfigRef?.name ?? 'unknown';
        const providerType = resolveProviderType(providerConfigName, providerConfigsList);
        const status = getStatusFromConditions(item?.status?.conditions);

        const {
          subaccountRef,
          serviceManagerRef,
          spaceRef,
          orgRef,
          cloudManagementRef,
          directoryRef,
          entitlementRef,
          globalAccountRef,
          orgRoleRef,
          spaceMembersRef,
          cloudFoundryEnvironmentRef,
          kymaEnvironmentRef,
          roleCollectionRef,
          roleCollectionAssignmentRef,
          subaccountTrustConfigurationRef,
          globalaccountTrustConfigurationRef,
        } = extractRefs(item);

        const parentId = serviceManagerRef || subaccountRef;
        const extraRefs = [
          spaceRef,
          orgRef,
          cloudManagementRef,
          directoryRef,
          entitlementRef,
          globalAccountRef,
          orgRoleRef,
          spaceMembersRef,
          cloudFoundryEnvironmentRef,
          kymaEnvironmentRef,
          roleCollectionRef,
          roleCollectionAssignmentRef,
          subaccountTrustConfigurationRef,
          globalaccountTrustConfigurationRef,
        ].filter(Boolean) as string[];

        if (id) {
          allNodesMap.set(id, {
            id,
            label: id,
            type: kind,
            providerConfigName,
            providerType,
            status,
            parentId,
            extraRefs,
            item,
            onYamlClick,
          });
        }
      });
    });
    return Array.from(allNodesMap.values());
  }, [managedResources, providerConfigsList, onYamlClick]);

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

  return { nodes, edges, colorMap, treeData, loading, error };
}
