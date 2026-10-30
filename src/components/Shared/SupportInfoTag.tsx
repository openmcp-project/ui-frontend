import { Tag } from '@ui5/webcomponents-react';
import { ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { purposeColorScheme, purposeLabel, ResolvedSupportInfo } from '../../lib/supportInfo.ts';
import { ProjectSupportInfoPopover } from '../Projects/ProjectSupportInfoPopover.tsx';
import { HoverRevealTag } from '../Ui/HoverRevealTag/HoverRevealTag.tsx';
import styles from './SupportInfoTag.module.css';

interface Props {
  resolved: ResolvedSupportInfo;
  testId?: string;
  renderEditDialog: (close: () => void) => ReactNode;
}

export function SupportInfoTag({ resolved, testId, renderEditDialog }: Props) {
  const { t } = useTranslation();
  const { info, inheritedFrom } = resolved;
  const openerId = useId();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const editDialog = editOpen && renderEditDialog(() => setEditOpen(false));

  if (!info.supportLandscape) {
    return (
      <>
        <HoverRevealTag
          delay={50}
          className={styles.tag}
          colorScheme={purposeColorScheme(undefined)}
          copy={t('SupportInfo.addButton')}
          design="Set2"
          id={openerId}
          onClick={() => setEditOpen(true)}
        />
        {editDialog}
      </>
    );
  }

  const inheritedTooltip = inheritedFrom
    ? t('SupportInfo.inheritedTooltip', { kind: t(`Entities.${inheritedFrom.kind}`), name: inheritedFrom.name })
    : undefined;

  return (
    <>
      <Tag
        id={openerId}
        interactive
        design="Set2"
        colorScheme={purposeColorScheme(info.supportLandscape)}
        className={inheritedFrom ? `${styles.tag} ${styles.inherited}` : styles.tag}
        data-testid={testId}
        data-inherited={inheritedFrom ? 'true' : undefined}
        title={inheritedTooltip}
        onClick={() => setPopoverOpen(true)}
      >
        {purposeLabel(t, info.supportLandscape)}
      </Tag>
      {popoverOpen && (
        <ProjectSupportInfoPopover
          opener={openerId}
          open={popoverOpen}
          inheritedFrom={inheritedFrom}
          supportLandscape={info.supportLandscape}
          supportServiceIds={info.supportServiceIds}
          supportSecurityContacts={info.supportSecurityContacts}
          supportOpsContacts={info.supportOpsContacts}
          onClose={() => setPopoverOpen(false)}
          onEditClick={() => setEditOpen(true)}
        />
      )}
      {editDialog}
    </>
  );
}
