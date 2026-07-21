import React, { useCallback, useMemo, useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Node,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { Button } from '@ui5/webcomponents-react';

import type { NodeProps } from '@xyflow/react';
import styles from './Graph.module.css';
import '@xyflow/react/dist/style.css';
import { NodeData, ColorBy } from './types';
import CustomNode from './CustomNode';
import { OrthogonalEdge } from './OrthogonalEdge';
import { Legend, LegendItem } from './Legend';
import { useTranslation } from 'react-i18next';
import { useGraph, type LayoutDirection } from './useGraph';
import { ManagedResourceItem } from '../../lib/shared/types';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useTheme } from '../../hooks/useTheme';
import { useLocalStoragePref } from '../../hooks/useLocalStoragePref';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from '../Yaml/YamlSidePanel.tsx';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { ApiConfigContext } from '../Shared/k8s';

const nodeTypes = {
  custom: (props: NodeProps<Node<NodeData, 'custom'>>) => (
    <CustomNode
      label={props.data.label}
      type={props.data.type}
      status={props.data.status}
      conditions={props.data.conditions}
      onYamlClick={() => props.data.onYamlClick(props.data.item)}
    />
  ),
};

const edgeTypes = {
  orth: OrthogonalEdge,
};

const FitOnLayoutChange: React.FC<{ layoutDirection: LayoutDirection; nodes: Node<NodeData>[] }> = ({
  layoutDirection,
  nodes,
}) => {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!nodes.length) return;
    // Wait one frame so ReactFlow has measured the new node positions.
    const id = requestAnimationFrame(() => fitView({ duration: 200 }));
    return () => cancelAnimationFrame(id);
  }, [layoutDirection, nodes, fitView]);
  return null;
};

const GraphInner: React.FC = () => {
  const { t } = useTranslation();
  const { openInAsideWithApiConfig } = useSplitter();
  const { isDarkTheme } = useTheme();
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const scope = [projectName, workspaceName, controlPlaneName];
  const [colorBy, setColorBy] = useLocalStoragePref<ColorBy>('graph.colorBy', 'source', scope);
  const [selectedLabelKey, setSelectedLabelKey] = useLocalStoragePref<string | undefined>(
    'graph.labelKey',
    undefined,
    scope,
  );
  const [layoutDirection, setLayoutDirection] = useLocalStoragePref<LayoutDirection>(
    'graph.layoutDirection',
    'TB',
    scope,
  );
  const apiConfig = useContext(ApiConfigContext);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  // Stable reference so apiConfig churn doesn't rebuild the Graph instance +
  // re-run elkjs on every parent render.
  const handleYamlClick = useStableCallback((item: ManagedResourceItem) => {
    const yamlFilename = item ? `${item.kind ?? ''}${item.metadata?.name ? '_' : ''}${item.metadata?.name ?? ''}` : '';
    openInAsideWithApiConfig(
      <YamlSidePanel resource={item as unknown as Resource} filename={yamlFilename} />,
      apiConfig,
    );
  });

  const { nodes, edges, colorMap, labelKey, availableLabelKeys, loading, error } = useGraph(
    colorBy,
    handleYamlClick,
    selectedLabelKey,
    layoutDirection,
  );

  const legendItems: LegendItem[] = useMemo(
    () =>
      Object.entries(colorMap).map(([name, color]) => {
        const isDefaultBucket = name === 'default' || !name;
        const displayName = (colorBy === 'flux' || colorBy === 'label') && isDefaultBucket ? t('common.none') : name;
        return { name: displayName, color };
      }),
    [colorMap, colorBy, t],
  );

  const connectedIds = useMemo(() => {
    if (!hoveredId) return null;
    const set = new Set<string>([hoveredId]);
    edges.forEach((e) => {
      if (e.source === hoveredId) set.add(e.target);
      if (e.target === hoveredId) set.add(e.source);
    });
    return set;
  }, [hoveredId, edges]);

  const displayedNodes = useMemo(() => {
    if (!connectedIds) return nodes;
    return nodes.map((n) => (connectedIds.has(n.id) ? n : { ...n, style: { ...n.style, opacity: 0.2 } }));
  }, [nodes, connectedIds]);

  const displayedEdges = useMemo(() => {
    if (!hoveredId) return edges;
    // Only rebuild the connected edges; keep refs for the rest so ReactFlow
    // skips reconciliation on unrelated nodes/edges.
    return edges.map((e) => {
      if (e.target === hoveredId) {
        return { ...e, animated: true, style: { ...e.style, stroke: '#0070f2', strokeWidth: 3, opacity: 1 } };
      }
      if (e.source === hoveredId) {
        return { ...e, animated: true, style: { ...e.style, stroke: '#e76500', strokeWidth: 3, opacity: 1 } };
      }
      return e;
    });
  }, [edges, hoveredId]);

  if (error) {
    return <div className={`${styles.message} ${styles.errorMessage}`}>{t('Graphs.loadingError')}</div>;
  }

  if (loading) {
    return <div className={styles.message}>{t('Graphs.loadingGraph')}</div>;
  }

  if (!nodes.length) {
    return <div className={styles.message}>{t('Graphs.noResources')}</div>;
  }

  return (
    <div ref={containerRef} className={styles.graphContainer} data-theme={isDarkTheme ? 'dark' : 'light'}>
      <div className={styles.graphColumn}>
        <ReactFlow
          data-theme={isDarkTheme ? 'dark' : 'light'}
          nodes={displayedNodes}
          edges={displayedEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            style: { stroke: '#888', strokeWidth: 1.5, opacity: 0.4 },
            markerStart: { type: MarkerType.ArrowClosed, color: '#888' },
          }}
          fitView
          minZoom={0.05}
          maxZoom={4}
          onlyRenderVisibleElements
          elevateNodesOnSelect={false}
          translateExtent={[
            [-Infinity, -Infinity],
            [Infinity, Infinity],
          ]}
          proOptions={{
            hideAttribution: true,
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={true}
          panOnDrag={true}
          onNodeMouseEnter={(_, n) => setHoveredId(n.id)}
          onNodeMouseLeave={() => setHoveredId(null)}
        >
          <Controls showInteractive={false} showFitView={false} />
          <Background />
          <FitOnLayoutChange layoutDirection={layoutDirection} nodes={nodes} />
          <Panel position="top-left" className={styles.panelContent}>
            <Button
              design="Transparent"
              icon={isFullscreen ? 'exit-full-screen' : 'full-screen'}
              tooltip={isFullscreen ? t('Graphs.exitFullscreen') : t('Graphs.enterFullscreen')}
              onClick={toggleFullscreen}
            />
          </Panel>
          <Panel position="top-right" className={styles.panelContent}>
            <Legend
              legendItems={legendItems}
              colorBy={colorBy}
              labelKey={labelKey}
              availableLabelKeys={availableLabelKeys}
              layoutDirection={layoutDirection}
              onColorByChange={(c) => {
                setColorBy(c);
                if (c !== 'label') setSelectedLabelKey(undefined);
              }}
              onLabelKeyChange={setSelectedLabelKey}
              onLayoutDirectionChange={setLayoutDirection}
            />
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

const Graph: React.FC = () => (
  <ReactFlowProvider>
    <GraphInner />
  </ReactFlowProvider>
);

export default Graph;
