import { useEffect, useMemo, useState } from 'react';
import { useApiResource, useProvidersConfigResource } from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../lib/shared/constants';
import { Edge, MarkerType, Node, Position } from '@xyflow/react';
import dagre from 'dagre';
import { ColorBy, NodeData } from './types';
import { extractRefs, generateColorMap, getStatusCondition, resolveProviderType } from './graphUtils';
import { ManagedResourceGroup, ManagedResourceItem } from '../../lib/shared/types';

const nodeWidth = 350;
const nodeHeight = 115;

function buildGraph(
  treeData: NodeData[],
  colorBy: ColorBy,
  colorMap: Record<string, string>,
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph({ compound: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'TB',
    ranksep: 80,
    nodesep: 100,
  });

  const nodeMap = new Map<string, Node<NodeData>>();

  for (const color in colorMap) {
    const node: Node<NodeData> = {
      id: color,
      type: 'custom_group',
      data: {
        label: color,
        id: color,
        providerConfigName: '',
        providerType: '',
        status: '',
        extraRefs: [],
        item: {
          kind: '',
          metadata: {
            name: '',
            creationTimestamp: '',
            labels: [],
          },
          apiVersion: undefined,
          spec: undefined,
          status: undefined,
        },
        onYamlClick: function (item: ManagedResourceItem): void {
          throw new Error('Function not implemented.');
        },
      },
      style: {
        //border: `2px solid ${colorMap[colorKey] || '#ccc'}`,
        //borderRadius: 8,
        //backgroundColor: 'var(--sapTile_Background, #fff)',
        width: nodeWidth,
        height: nodeHeight,
      },
      width: nodeWidth,
      height: nodeHeight,
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      //parentId: colorBy,
    };
    nodeMap.set(color, node);
    console.log('GROUP:', node.id);

    dagreGraph.setNode(color, { width: nodeWidth * 0, height: nodeHeight * 0 });
  }
  //dagreGraph.setGraph({ ...existingOptions, compound: true })
  /*dagreGraph.setNode('GROUP', { width: nodeWidth * 3, height: nodeHeight * 3 });
  dagreGraph.setNode('CUSTOM', { width: nodeWidth, height: nodeHeight });
  console.log(dagreGraph.graph().compound);
  console.log(dagreGraph.graph().ranksep);
  debugger;
  dagreGraph.setParent('CUSTOM', 'GROUP');*/
  treeData.forEach((n) => {
    const colorKey: string =
      colorBy === 'source' ? n.providerType : colorBy === 'flux' ? (n.fluxName ?? 'default') : n.providerConfigName;
    const node: Node<NodeData> = {
      id: n.id,
      type: 'custom',
      data: { ...n },
      style: {
        //border: `2px solid ${colorMap[colorKey] || '#ccc'}`,
        //borderRadius: 8,
        //backgroundColor: 'var(--sapTile_Background, #fff)',
        width: nodeWidth,
        height: nodeHeight,
      },
      width: nodeWidth,
      height: nodeHeight,
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      //parentId: colorKey,
      //extent: 'parent',
    };
    nodeMap.set(n.id, node);

    dagreGraph.setNode(n.id, { width: nodeWidth, height: nodeHeight });
    //debugger;
    dagreGraph.setParent(n.id, colorKey);
    //debugger;
  });

  const edgeList: Edge[] = [];
  treeData.forEach((n) => {
    const colorKey: string =
      colorBy === 'source' ? n.providerType : colorBy === 'flux' ? (n.fluxName ?? 'default') : n.providerConfigName;
    if (n.parentId && n.parentId !== colorKey && n.id !== colorKey) {
      dagreGraph.setEdge(n.parentId, n.id);
      edgeList.push({
        id: `e-${n.parentId}-${n.id}`,
        source: n.parentId,
        target: n.id,
        type: 'smoothstep',
      });
    }
    n.extraRefs?.forEach((refId) => {
      if (nodeMap.has(refId)) {
        dagreGraph.setEdge(refId, n.id);
        edgeList.push({
          id: `e-${refId}-${n.id}`,
          source: refId,
          target: n.id,
          type: 'smoothstep',
        });
      }
    });
  });

  treeData.forEach((n) => {
    const colorKey: string =
      colorBy === 'source' ? n.providerType : colorBy === 'flux' ? (n.fluxName ?? 'default') : n.providerConfigName;

    //if (edgeList.includes((edge) => edge.id === `e-${n.parentId}-${n.id}`))

    //debugger;
    //dagreGraph.setParent(n.id, colorKey);
  });

  dagre.layout(dagreGraph);
  nodeMap.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    node.position = { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 };
  });

  // Set width / height of grouping nodes

  // ******
  const groupsBounds = new Map<string, { minX: number; minY: number; maxX: number; maxY: number }>();

  nodeMap.forEach((n) => {
    if (n.type !== 'custom') return;
    const d = n.data!;
    const groupId =
      colorBy === 'source' ? d.providerType : colorBy === 'flux' ? (d.fluxName ?? 'default') : d.providerConfigName;

    const left = n.position.x;
    const top = n.position.y;
    const right = left + (n.width ?? nodeWidth);
    const bottom = top + (n.height ?? nodeHeight);

    const b = groupsBounds.get(groupId);
    if (!b) {
      groupsBounds.set(groupId, { minX: left, minY: top, maxX: right, maxY: bottom });
    } else {
      b.minX = Math.min(b.minX, left);
      b.minY = Math.min(b.minY, top);
      b.maxX = Math.max(b.maxX, right);
      b.maxY = Math.max(b.maxY, bottom);
    }
  });

  const PADDING = 48;
  const PADDING_TOP = 136;
  groupsBounds.forEach((b, groupId) => {
    const groupNode = nodeMap.get(groupId);
    if (!groupNode) return;

    const gw = b.maxX - b.minX + 2 * PADDING;
    const gh = b.maxY - b.minY + PADDING + PADDING_TOP;
    const gx = b.minX - PADDING;
    const gy = b.minY - PADDING_TOP;

    groupNode.position = { x: gx, y: gy };
    groupNode.width = gw;
    groupNode.height = gh;
    groupNode.style = { ...(groupNode.style ?? {}), width: gw, height: gh };
  });

  // ******
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

  const treeDataTemp = useMemo(() => {
    if (!managedResources || !providerConfigsList) return [];
    const allNodesMap = new Map<string, NodeData>();
    managedResources.forEach((group: ManagedResourceGroup) => {
      group.items?.forEach((item: ManagedResourceItem) => {
        const id = item?.metadata?.name;
        const kind = item?.kind;
        const providerConfigName = item?.spec?.providerConfigRef?.name ?? 'unknown';
        const providerType = resolveProviderType(providerConfigName, providerConfigsList);
        const statusCond = getStatusCondition(item?.status?.conditions);
        const status = statusCond?.status === 'True' ? 'OK' : 'ERROR';

        let fluxName: string | undefined;
        const labelsMap = (item.metadata as unknown as { labels?: Record<string, string> }).labels;
        if (labelsMap) {
          const key = Object.keys(labelsMap).find((k) => k.endsWith('/name'));
          if (key) fluxName = labelsMap[key];
        }

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

        let parentId = serviceManagerRef || subaccountRef;
        if (!parentId) {
          parentId = fluxName ?? 'default';
        }
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
            transitionTime: statusCond?.lastTransitionTime ?? '',
            statusMessage: statusCond?.reason ?? statusCond?.message ?? '',
            fluxName,
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

  const colorMap = useMemo(() => generateColorMap(treeDataTemp, colorBy), [treeDataTemp, colorBy]);

  const treeData = useMemo(() => {
    const XX: NodeData[] = [];
    /*for (const color in colorMap) {
      console.log(color);
      XX.push({
        id: color,
        extraRefs: [],
        item: null,
        label: color,

        //onYamlClick(item: ManagedResourceItem): void {},
        //providerConfigName: '',
        //providerType: '',
        status: '',
      });
    }*/

    for (const x of treeDataTemp) {
      XX.push(x);
    }

    return XX;
  }, [treeDataTemp, colorMap]);

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
