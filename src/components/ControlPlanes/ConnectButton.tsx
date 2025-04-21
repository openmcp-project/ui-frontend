import { Button, Menu, MenuItem } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import { GetKubeconfig } from '../../lib/api/types/crate/getKubeconfig.ts';
import yaml from 'js-yaml';
import { useRef, useState } from 'react';
import { DownloadKubeconfig } from './CopyKubeconfigButton.tsx';
import useResource from '../../lib/api/useApiResource.ts';
import { extractWorkspaceNameFromNamespace } from '../../utils/index.ts';
import { useTranslation } from 'react-i18next';

interface Props {
  projectName: string;
  workspaceName: string;
  controlPlaneName: string;
  secretName: string;
  namespace: string;
  secretKey: string;
  disabled?: boolean;
}

export default function ConnectButton(props: Props) {
  const navigate = useLuigiNavigate();
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenerClick = (e: any) => {
    if (popoverRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ref = popoverRef.current as any;
      ref.opener = e.target;
      setOpen((prev) => !prev);
    }
  };

  const { t } = useTranslation();

  const res = useResource(
    GetKubeconfig(props.secretKey, props.secretName, props.namespace),
  );
  if (res.isLoading) {
    return <></>;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kubeconfig = yaml.load(res.data as string) as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contexts = kubeconfig.contexts as any[];
  const currentContext = kubeconfig['current-context'];
  if (!currentContext) {
    return <></>;
  }

  if (contexts.length === 1) {
    return (
      <Button
        disabled={props.disabled}
        onClick={() =>
          navigate(
            `/mcp/projects/${props.projectName}/workspaces/${extractWorkspaceNameFromNamespace(
              props.workspaceName,
            )}/mcps/${props.controlPlaneName}/context/${currentContext}`,
          )
        }
      >
        {t('ConnectButton.buttonText')}
      </Button>
    );
  }

  return (
    <div>
      <Button
        disabled={props.disabled}
        icon="slim-arrow-down"
        icon-end
        onClick={handleOpenerClick}
      >
        {t('ConnectButton.buttonText')}
      </Button>
      <Menu
        ref={popoverRef}
        open={open}
        onItemClick={(event) => {
          if (event.detail.item.dataset.action === 'download') {
            event.preventDefault();
            DownloadKubeconfig(res.data as string, props.controlPlaneName);
          }
          const target = event.detail?.item?.dataset?.target;
          if (target) {
            navigate(target);
          }
        }}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any  */}
        {contexts.map((context: any) => (
          <MenuItem
            key={context.name}
            text={context.context.user}
            data-target={`/mcp/projects/${props.projectName}/workspaces/${extractWorkspaceNameFromNamespace(
              props.workspaceName,
            )}/mcps/${props.controlPlaneName}/context/${context.name}`}
            additionalText={
              currentContext === context.name ? '(default IdP)' : undefined
            }
          />
        ))}
        <MenuItem
          key={'download'}
          text={'Download Kubeconfig'}
          data-action="download"
        />
      </Menu>
    </div>
  );
}
