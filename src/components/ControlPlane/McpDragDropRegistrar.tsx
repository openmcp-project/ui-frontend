import { useEffect, useMemo } from 'react';
import { useMcp } from '../../lib/shared/McpContext';
import { useYamlApply } from '../../context/YamlApplyContext';

interface Props {
  name: string;
}

export function McpDragDropRegistrar({ name }: Props) {
  const mcp = useMcp();
  const { setActiveMcp } = useYamlApply();

  const apiConfig = useMemo(
    () => ({
      mcpConfig: {
        projectName: mcp.project,
        workspaceName: mcp.workspace,
        controlPlaneName: mcp.name,
        isV2: mcp.isV2,
        idp: mcp.idp,
      },
    }),
    [mcp.project, mcp.workspace, mcp.name, mcp.isV2, mcp.idp],
  );

  useEffect(() => {
    setActiveMcp({ name, apiConfig });
    return () => setActiveMcp(null);
  }, [name, apiConfig, setActiveMcp]);

  return null;
}
