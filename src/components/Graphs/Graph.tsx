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
  NodeProps,
} from 'reactflow';
import styles from './Graph.module.css';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { useApiResource, useProvidersConfigResource } from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../lib/shared/constants';
import { NodeData, ManagedResourceGroup, ManagedResourceItem } from './types';
import CustomNode from './CustomNode';
import { Legend, LegendItem } from './Legend';
import { extractRefs, generateColorMap, getStatusFromConditions, resolveProviderType } from './graphUtils';
import { YamlViewDialog } from '../Yaml/YamlViewDialog';
import YamlViewer from '../Yaml/YamlViewer';
import { stringify } from 'yaml';
import { removeManagedFieldsProperty } from '../../utils/removeManagedFieldsProperty';
import { useTranslation } from 'react-i18next';

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

const Graph: React.FC = () => {
  const { t } = useTranslation();
   
  const { data: managedResources, error: managedResourcesError } = useApiResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval,
  });
  const { data: providerConfigsList, error: providerConfigsError } = useProvidersConfigResource({
    refreshInterval: resourcesInterval,
  });
  const [nodes, setNodes] = useNodesState<NodeData>([]);
  const [edges, setEdges] = useEdgesState<Edge[]>([]);
  const [colorBy, setColorBy] = useState<'provider' | 'source'>('provider');

  const [yamlDialogOpen, setYamlDialogOpen] = useState(false);
  const [yamlResource, setYamlResource] = useState<ManagedResourceItem | null>(null);

  const handleYamlClick = (item: ManagedResourceItem) => {
    setYamlResource(item);
    setYamlDialogOpen(true);
  };

  const nodeTypes = {
    custom: (props: NodeProps<NodeData>) => (
  <CustomNode
    label={props.data.label}
    type={props.data.type}
    status={props.data.status}
    onYamlClick={() => handleYamlClick(props.data.item)}
  />
),
  };

  const yamlString = useMemo(
    () => (yamlResource ? stringify(removeManagedFieldsProperty(yamlResource)) : ''),
    [yamlResource],
  );
  const yamlFilename = useMemo(() => {
    if (!yamlResource) return '';
    const { kind, metadata } = yamlResource;
    return `${kind ?? ''}${metadata?.name ? '_' : ''}${metadata?.name ?? ''}`;
  }, [yamlResource]);

  const treeData = useMemo(() => {
    const allNodesMap = new Map<string, NodeData>();
    if (managedResources) {
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
            });
          }
        });
      });
    }
    return Array.from(allNodesMap.values());
  }, [managedResources, providerConfigsList]);

  const colorMap = useMemo(() => generateColorMap(treeData, colorBy), [treeData, colorBy]);
  const legendItems: LegendItem[] = useMemo(
    () =>
      Object.entries(colorMap).map(([name, color]) => ({
        name: name === 'default' ? 'default' : name,
        color,
      })),
    [colorMap]
  );

  useEffect(() => {
    if (!treeData.length) return;
    const { nodes, edges } = buildGraph(treeData, colorBy, colorMap);
    setNodes(nodes);
    setEdges(edges);
  }, [treeData, colorBy, colorMap, setNodes, setEdges]);

  if (managedResourcesError || providerConfigsError) {
    return <div className={`${styles.message} ${styles.errorMessage}`}>{t('Graphs.loadingError')}</div>;
  }

  if (!managedResources || !providerConfigsList) {
    return <div className={styles.message}>{t('Graphs.loadingGraph')}</div>;
  }

  if (treeData.length === 0) {
    return <div className={styles.message}>{t('Graphs.noResources')}</div>;
  }

  return (
  <div className={styles.graphContainer}>
    <div className={styles.graphColumn}>
      <div className={styles.graphHeader}>
        <span className={styles.colorizedTitle}>{t('Graphs.colorizedTitle')}</span>
        <label>
          <input
            type="radio"
            name="colorBy"
            value="provider"
            checked={colorBy === 'provider'}
            onChange={() => setColorBy('provider')}
          />{' '}
          {t('Graphs.colorsProviderConfig')}
        </label>
        <label>
          <input
            type="radio"
            name="colorBy"
            value="source"
            checked={colorBy === 'source'}
            onChange={() => setColorBy('source')}
          />{' '}
          {t('Graphs.colorsProvider')}
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
    <YamlViewDialog
      isOpen={yamlDialogOpen}
      setIsOpen={setYamlDialogOpen}
      dialogContent={<YamlViewer yamlString={yamlString} filename={yamlFilename} />}
    />
    <Legend legendItems={legendItems} />
  </div>
);
};

export default Graph;
