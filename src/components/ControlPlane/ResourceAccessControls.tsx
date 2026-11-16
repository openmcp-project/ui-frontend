import { Button, type ButtonPropTypes } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { useCanI as _useCanI } from '../../lib/api/access/useCanI.ts';
import { resourceAccessAttributes, type AccessResource } from '../../lib/api/access/resourceAccessAttributes.ts';
import { ActionsMenu, type ActionsMenuProps } from './ActionsMenu.tsx';

interface AccessProps {
  item: AccessResource;
  resource: string;
  useCanI?: typeof _useCanI;
}

/** V2-only: named, namespaced permission checks, shared by the legacy tables. */
export function ResourceEditButton({
  item,
  resource,
  useCanI = _useCanI,
  disabled,
  tooltip,
  onClick,
  ...props
}: AccessProps & ButtonPropTypes) {
  const { t } = useTranslation();
  const { state } = useCanI(resourceAccessAttributes(item, resource, 'patch'), { target: 'mcp' });
  const denied = state === 'denied';
  return (
    <Button
      {...props}
      disabled={disabled || denied}
      tooltip={denied ? t('access.noAccessAction') : tooltip}
      onClick={(event) => {
        if (!disabled && !denied) onClick?.(event);
      }}
    />
  );
}

export function ResourceActionsMenu<T extends AccessResource>({
  item,
  resource,
  actions,
  useCanI = _useCanI,
}: AccessProps & ActionsMenuProps<T>) {
  const { t } = useTranslation();
  const { state: patchState } = useCanI(resourceAccessAttributes(item, resource, 'patch'), { target: 'mcp' });
  const { state: deleteState } = useCanI(
    actions.some((action) => action.key === 'delete') ? resourceAccessAttributes(item, resource, 'delete') : null,
    { target: 'mcp' },
  );
  return (
    <ActionsMenu
      item={item}
      actions={actions.map((action) => {
        const denied =
          (action.key === 'edit' && patchState === 'denied') || (action.key === 'delete' && deleteState === 'denied');
        return {
          ...action,
          disabled: action.disabled || denied,
          tooltip: denied ? t('access.noAccessAction') : action.tooltip,
        };
      })}
    />
  );
}
