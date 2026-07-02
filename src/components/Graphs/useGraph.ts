import { useEffect, useMemo, useState } from 'react';
import { useApiResource, useProvidersConfigResource } from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../lib/shared/constants';
import { Edge, Node } from '@xyflow/react';
import { ColorBy, NodeData } from './types';
import { Graph, LayoutDirection } from './Graph.model';
import { ManagedResourceItem } from '../../lib/shared/types';

export type { EdgePoint, LayoutDirection } from './Graph.model';

export function useGraph(
  colorBy: ColorBy,
  onYamlClick: (item: ManagedResourceItem) => void,
  selectedLabelKey?: string,
  layoutDirection: LayoutDirection = 'TB',
) {
  const {
    data: managedResources,
    isLoading: managedResourcesLoading,
    error: managedResourcesError,
  } = useApiResource(ManagedResourcesRequest, { refreshInterval: resourcesInterval });
  const {
    data: providerConfigsList,
    isLoading: providerConfigsLoading,
    error: providerConfigsError,
  } = useProvidersConfigResource({ refreshInterval: resourcesInterval });

  const loading = managedResourcesLoading || providerConfigsLoading;
  const error = managedResourcesError || providerConfigsError;

  const graph = useMemo(
    () =>
      new Graph({
        managedResources,
        providerConfigs: providerConfigsList,
        onYamlClick,
      }),
    [managedResources, providerConfigsList, onYamlClick],
  );

  const availableLabelKeys = useMemo(() => (colorBy === 'label' ? graph.listCommonLabelKeys() : []), [graph, colorBy]);

  const labelKey = useMemo(() => {
    if (colorBy !== 'label') return undefined;
    if (selectedLabelKey && availableLabelKeys.includes(selectedLabelKey)) return selectedLabelKey;
    return availableLabelKeys[0];
  }, [colorBy, selectedLabelKey, availableLabelKeys]);

  const colorMap = useMemo(() => graph.generateColorMap(colorBy, labelKey), [graph, colorBy, labelKey]);

  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!graph.nodes.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNodes([]);

      setEdges([]);
      return;
    }
    let cancelled = false;
    graph
      .layout({ showAux: true, colorBy, labelKey, colorMap, direction: layoutDirection })
      .then((laid) => {
        if (cancelled) return;
        setNodes(laid.nodes);
        setEdges(laid.edges);
      })
      .catch((err) => {
        console.error('Graph layout failed', err);
        if (cancelled) return;
        setNodes([]);
        setEdges([]);
      });
    return () => {
      cancelled = true;
    };
  }, [graph, colorBy, colorMap, labelKey, layoutDirection]);

  return { nodes, edges, colorMap, labelKey, availableLabelKeys, loading, error };
}
