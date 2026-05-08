import { Toolbar, ToolbarButton } from '@ui5/webcomponents-react';
import { useState } from 'react';
import { CreateProjectDialogContainer } from '../Dialogs/CreateProjectDialogContainer.tsx';
import { useAnalyticsOptional } from '../../lib/analytics';

export function ProjectListToolbar() {
  const [dialogCreateProjectIsOpen, setDialogIsOpen] = useState(false);
  const analytics = useAnalyticsOptional();

  const handleCreateClick = () => {
    analytics?.trackEvent('Create Project Button Clicked', {
      location: 'toolbar',
    });
    setDialogIsOpen(true);
  };

  return (
    <>
      <Toolbar>
        <ToolbarButton icon="add" text="Project" onClick={handleCreateClick} />
      </Toolbar>
      <CreateProjectDialogContainer isOpen={dialogCreateProjectIsOpen} setIsOpen={setDialogIsOpen} />
    </>
  );
}
