import React, { useState, useCallback, useMemo } from 'react';
import { ReactFlow, Background, Controls, MarkerType, Node, Panel } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { RadioButton, FlexBox, FlexBoxAlignItems } from '@ui5/webcomponents-react';
import styles from './Graph.module.css';
import '@xyflow/react/dist/style.css';
import { NodeData, ColorBy } from './types';
import CustomNode from './CustomNode';
import { Legend, LegendItem } from './Legend';
import { useTranslation } from 'react-i18next';
import { useGraph } from './useGraph';
import { ManagedResourceItem } from '../../lib/shared/types';
import { useTheme } from '../../hooks/useTheme';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from '../Yaml/YamlSidePanel.tsx';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';



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
  const { openInAside } = useSplitter();
  const { isDarkTheme } = useTheme();
  const [colorBy, setColorBy] = useState<ColorBy>('provider');

  const handleYamlClick = useCallback(
    (item: ManagedResourceItem) => {
      const yamlFilename = item
        ? `${item.kind ?? ''}${item.metadata?.name ? '_' : ''}${item.metadata?.name ?? ''}`
        : '';

      openInAside(<YamlSidePanel resource={item as unknown as Resource} filename={yamlFilename} />);
    },
    [openInAside],
  );

  const { nodes, edges, colorMap, loading, error } = useGraph(colorBy, handleYamlClick);

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
    <div className={styles.graphContainer} data-theme={isDarkTheme ? 'dark' : 'light'}>
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
    </div>
  );
};

export default Graph;
