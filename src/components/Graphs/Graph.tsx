import React, { useState, useCallback, useMemo } from 'react';
import { ReactFlow, Background, Controls, MarkerType, Node, Panel } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { RadioButton, FlexBox, FlexBoxAlignItems } from '@ui5/webcomponents-react';
import styles from './Graph.module.css';
import '@xyflow/react/dist/style.css';
import { NodeData, ColorBy } from './types';
import CustomNode from './CustomNode';
import { Legend, LegendItem } from './Legend';
import { YamlViewDialog } from '../Yaml/YamlViewDialog';
import YamlViewer from '../Yaml/YamlViewer';
import { stringify } from 'yaml';
import { removeManagedFieldsProperty } from '../../utils/removeManagedFieldsProperty';
import { useTranslation } from 'react-i18next';
import { useGraph } from './useGraph';
import { ManagedResourceItem } from '../../lib/shared/types';
import { useTheme } from '../../hooks/useTheme';

const nodeTypes = {
  custom: (props: NodeProps<Node<NodeData, 'custom'>>) => (
    <CustomNode
      label={props.data.label}
      type={props.data.type}
      status={props.data.status}
      transitionTime={props.data.transitionTime}
      statusMessage={props.data.statusMessage}
      onYamlClick={() => props.data.onYamlClick(props.data.item)}
    />
  ),
};

const Graph: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkTheme } = useTheme();
  const [colorBy, setColorBy] = useState<ColorBy>('provider');
  const [yamlDialogOpen, setYamlDialogOpen] = useState(false);
  const [yamlResource, setYamlResource] = useState<ManagedResourceItem | null>(null);

  const handleYamlClick = useCallback((item: ManagedResourceItem) => {
    setYamlResource(item);
    setYamlDialogOpen(true);
  }, []);

  const { nodes, edges, colorMap, loading, error } = useGraph(colorBy, handleYamlClick);

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
      Object.entries(colorMap).map(([name, color]) => {
        const displayName = colorBy === 'flux' && (name === 'default' || !name) ? t('common.none') : name;
        return { name: displayName, color };
      }),
    [colorMap, colorBy, t],
  );

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
    <div
      className={styles.graphContainer}
      data-theme={isDarkTheme ? 'dark' : 'light'}
    >
      <div className={styles.graphColumn}>
        <ReactFlow
          data-theme={isDarkTheme ? 'dark' : 'light'}
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
          <Controls showInteractive={false} />
          <Background />
          <Panel position="top-left">
            <FlexBox alignItems={FlexBoxAlignItems.Center} role="radiogroup">
              <fieldset className={styles.fieldsetReset}>
                <div className={styles.graphHeader}>
                  <span className={styles.colorizedTitle}>{t('Graphs.colorizedTitle')}</span>
                  <RadioButton
                    name="colorBy"
                    text={t('Graphs.colorsProviderConfig')}
                    checked={colorBy === 'provider'}
                    onChange={() => setColorBy('provider')}
                  />
                  <RadioButton
                    name="colorBy"
                    text={t('Graphs.colorsProvider')}
                    checked={colorBy === 'source'}
                    onChange={() => setColorBy('source')}
                  />
                  <RadioButton
                    name="colorBy"
                    text={t('Graphs.colorsFlux')}
                    checked={colorBy === 'flux'}
                    onChange={() => setColorBy('flux')}
                  />
                </div>
              </fieldset>
            </FlexBox>
          </Panel>
          <Panel position="top-right">
            <Legend legendItems={legendItems} />
          </Panel>
        </ReactFlow>
      </div>
      <YamlViewDialog
        isOpen={yamlDialogOpen}
        setIsOpen={setYamlDialogOpen}
        dialogContent={<YamlViewer yamlString={yamlString} filename={yamlFilename} />}
      />
    </div>
  );
};

export default Graph;
