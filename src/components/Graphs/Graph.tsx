import React, { useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import styles from './Graph.module.css';
import '@xyflow/react/dist/style.css';
import { ManagedResourceItem } from './types';
import CustomNode from './CustomNode';
import { Legend, LegendItem } from './Legend';
import { YamlViewDialog } from '../Yaml/YamlViewDialog';
import YamlViewer from '../Yaml/YamlViewer';
import { stringify } from 'yaml';
import { removeManagedFieldsProperty } from '../../utils/removeManagedFieldsProperty';
import { useTranslation } from 'react-i18next';
import { useGraph } from './useGraph';

const Graph: React.FC = () => {
  const { t } = useTranslation();
  const [colorBy, setColorBy] = useState<'provider' | 'source'>('provider');
  const { nodes, edges, colorMap, treeData, loading } = useGraph(colorBy);

  const [yamlDialogOpen, setYamlDialogOpen] = useState(false);
  const [yamlResource, setYamlResource] = useState<ManagedResourceItem | null>(null);

  const handleYamlClick = (item: ManagedResourceItem) => {
    setYamlResource(item);
    setYamlDialogOpen(true);
  };

  const nodeTypes = {
    custom: (props: NodeProps) => (
      <CustomNode
        label={props.data.label as string}
        type={props.data.type as string}
        status={props.data.status as string}
        onYamlClick={() => handleYamlClick(props.data.item as ManagedResourceItem)}
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

  const legendItems: LegendItem[] = useMemo(
    () =>
      Object.entries(colorMap).map(([name, color]) => ({
        name: name === 'default' ? 'default' : name,
        color,
      })),
    [colorMap],
  );

  if (loading) {
    return <div className={styles.message}>{t('Graphs.loadingGraph')}</div>;
  }

  if (!treeData.length) {
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
          proOptions={{
            hideAttribution: true,
          }}
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
