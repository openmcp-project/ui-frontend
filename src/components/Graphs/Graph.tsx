import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactFlow, Background, Controls, Node, BackgroundVariant } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Button, Popover } from '@ui5/webcomponents-react';
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

interface GraphProps {
  colorBy?: ColorBy;
}

const Graph: React.FC<GraphProps> = ({ colorBy: initialColorBy = 'source' }) => {
  const { t } = useTranslation();
  const { isDarkTheme } = useTheme();
  const [colorBy, setColorBy] = useState<ColorBy>(initialColorBy);
  const [yamlDialogOpen, setYamlDialogOpen] = useState(false);
  const [yamlResource, setYamlResource] = useState<ManagedResourceItem | null>(null);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

  // Update colorBy when prop changes
  useEffect(() => {
    setColorBy(initialColorBy);
  }, [initialColorBy]);

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
    <div className={styles.graphContainer} data-theme={isDarkTheme ? 'dark' : 'light'}>
      <div className={styles.graphColumn}>
        <ReactFlow
          data-theme={isDarkTheme ? 'dark' : 'light'}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 40, y: 40, zoom: 0.8 }}
          minZoom={0.3}
          maxZoom={3.0}
          proOptions={{
            hideAttribution: true,
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={true}
          panOnDrag={true}
        >
          <Background gap={20} variant={BackgroundVariant.Dots} bgColor='#ffffff' />
          <Controls showInteractive={false} />
        </ReactFlow>
        
        {/* Legend and filter in bottom-right */}
        <div className={styles.bottomLegendContainer}>
          <Legend legendItems={legendItems} horizontal={true} />
          <Popover
            opener="filter-button"
            open={filterPopoverOpen}
            onClose={() => setFilterPopoverOpen(false)}
            placement="Top"
          >
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button
                design={colorBy === 'source' ? 'Emphasized' : 'Default'}
                onClick={() => {
                  setColorBy('source');
                  setFilterPopoverOpen(false);
                }}
              >
                {t('Graphs.colorsProvider')}
              </Button>
              <Button
                design={colorBy === 'provider' ? 'Emphasized' : 'Default'}
                onClick={() => {
                  setColorBy('provider');
                  setFilterPopoverOpen(false);
                }}
              >
                {t('Graphs.colorsProviderConfig')}
              </Button>
              <Button
                design={colorBy === 'flux' ? 'Emphasized' : 'Default'}
                onClick={() => {
                  setColorBy('flux');
                  setFilterPopoverOpen(false);
                }}
              >
                {t('Graphs.colorsFlux')}
              </Button>
            </div>
          </Popover>
          <div className={styles.filterIcon}>
            <Button
              id="filter-button"
              design="Transparent"
              icon="filter"
              tooltip={t('Graphs.colorizedTitle')}
              onClick={() => setFilterPopoverOpen(!filterPopoverOpen)}
            />
          </div>
        </div>
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
