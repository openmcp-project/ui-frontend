import React, { useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import styles from './Graph.module.css';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import {
  useApiResource,
  useProvidersConfigResource,
} from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { ProvidersListRequest } from '../../lib/api/types/crossplane/listProviders';
import { resourcesInterval } from '../../lib/shared/constants';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { NodeData, ManagedResourceGroup, ManagedResourceItem } from './types';
import CustomNode from './CustomNode';
import { Legend } from './Legend';
import {
  extractRefs,
  generateColorMap,
  getStatusFromConditions,
  resolveProviderType,
} from './graphUtils';

const nodeWidth = 250;
const nodeHeight = 60;

const nodeTypes = {
  custom: CustomNode,
};

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
    const colorKey =
      colorBy === 'source' ? n.providerType : n.providerConfigName;
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

const Graph: React.FC = () => {
  const { data: managedResources, error: managedResourcesError } =
    useApiResource(ManagedResourcesRequest, {
      refreshInterval: resourcesInterval,
    });
  const { data: providers, error: providersError } = useApiResource(
    ProvidersListRequest,
    {
      refreshInterval: resourcesInterval,
    },
  );
  const { data: providerConfigsList, error: providerConfigsError } =
    useProvidersConfigResource({
      refreshInterval: resourcesInterval,
    });
  const [nodes, setNodes] = useNodesState<NodeData>([]);
  const [edges, setEdges] = useEdgesState<Edge[]>([]);
  const [colorBy, setColorBy] = useState<'provider' | 'source'>('provider');

  const treeData = useMemo(() => {
    const allNodesMap = new Map<string, NodeData>();
    if (managedResources) {
      managedResources.forEach((group: ManagedResourceGroup) => {
        group.items?.forEach((item: ManagedResourceItem) => {
          const id = item?.metadata?.name;
          const kind = item?.kind;
          const providerConfigName =
            item?.spec?.providerConfigRef?.name ?? 'unknown';
          const providerType = resolveProviderType(
            providerConfigName,
            providerConfigsList,
          );
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
            });
          }
        });
      });
    }
    return Array.from(allNodesMap.values());
  }, [managedResources, providerConfigsList]);

  const colorMap = useMemo(
    () => generateColorMap(treeData, colorBy, providers?.items),
    [treeData, colorBy, providers?.items],
  );

  useEffect(() => {
    if (!treeData.length) return;
    const { nodes, edges } = buildGraph(treeData, colorBy, colorMap);
    setNodes(nodes);
    setEdges(edges);
  }, [treeData, colorBy, colorMap, setNodes, setEdges]);

  if (managedResourcesError || providersError || providerConfigsError) {
    return (
      <div className={`${styles.centeredMessage} ${styles.errorMessage}`}>
        Error loading graph data.
      </div>
    );
  }

  if (!managedResources || !providers || !providerConfigsList) {
    return <div className={styles.centeredMessage}>Loading graph data...</div>;
  }

  if (treeData.length === 0) {
    return (
      <div className={styles.centeredMessage}>No resources to display.</div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '600px',
        border: '1px solid #ddd',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fafafa',
        fontFamily: ThemingParameters.sapFontFamily,
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '0.5rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 500 }}>Colorized by:</span>
          <label>
            <input
              type="radio"
              name="colorBy"
              value="provider"
              checked={colorBy === 'provider'}
              onChange={() => setColorBy('provider')}
            />{' '}
            Provider Config
          </label>
          <label>
            <input
              type="radio"
              name="colorBy"
              value="source"
              checked={colorBy === 'source'}
              onChange={() => setColorBy('source')}
            />{' '}
            Provider
          </label>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            style: { stroke: '#888', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
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
      <Legend
        nodes={nodes.map((n) => n.data as unknown as NodeData)}
        colorBy={colorBy}
        providers={providers?.items || []}
        generateColorMap={generateColorMap}
      />
    </div>
  );
};

export default Graph;
