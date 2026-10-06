import { useEffect } from 'react';
import { useMcp } from '../../lib/shared/McpContext.tsx';
import { useYamlApply } from '../../context/YamlApplyContext.tsx';
import { ApiConfig } from '../../lib/api/types/apiConfig.ts';

/**
 * Registers the current MCP as the drag-drop target while the MCP page is mounted.
 * Renders nothing — side-effect only.
 */
export function McpDragDropRegistrar() {
  const { project, workspace, name, isV2, idp } = useMcp();
  const { setActiveMcp } = useYamlApply();

  useEffect(() => {
    if (!project || !workspace || !name) return;

    const apiConfig: ApiConfig = {
      mcpConfig: {
        projectName: project,
        workspaceName: workspace,
        controlPlaneName: name,
        isV2: isV2 ?? false,
        idp,
      },
    };

    setActiveMcp({ name, apiConfig });

    return () => {
      setActiveMcp(null);
    };
  }, [project, workspace, name, isV2, idp, setActiveMcp]);

  return null;
}
