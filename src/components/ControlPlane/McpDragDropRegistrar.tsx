import { useEffect, useMemo } from 'react';
import { buildMcpApiConfig, useMcp } from '../../lib/shared/McpContext';
import { useYamlApply } from '../../context/YamlApplyContext';

interface Props {
  name: string;
}

export function McpDragDropRegistrar({ name }: Props) {
  const mcp = useMcp();
  const { setActiveMcp } = useYamlApply();

  const { project, workspace, name: cpName, isV2, idp } = mcp;
  const apiConfig = useMemo(
    () => buildMcpApiConfig({ project, workspace, name: cpName, isV2, idp }),
    [project, workspace, cpName, isV2, idp],
  );

  useEffect(() => {
    setActiveMcp({ name, apiConfig });
    return () => setActiveMcp(null);
  }, [name, apiConfig, setActiveMcp]);

  return null;
}
