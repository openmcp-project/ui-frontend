import { ReactNode, useCallback, useState } from 'react';
import { useYamlApply } from '../../context/YamlApplyContext.tsx';
import { DragDropOverlay } from './DragDropOverlay.tsx';
import { YamlApplyDialog } from './YamlApplyDialog.tsx';

interface DragDropYamlProviderProps {
  children: ReactNode;
}

export function DragDropYamlProvider({ children }: DragDropYamlProviderProps) {
  const { activeMcp, pendingFile, requestApplyFile, clearPendingFile } = useYamlApply();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) requestApplyFile(file);
    },
    [requestApplyFile],
  );

  const handleCancelDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDialogClose = useCallback(() => {
    clearPendingFile();
  }, [clearPendingFile]);

  return (
    <div style={{ display: 'contents' }} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDrop={handleDrop}>
      {children}
      {isDragging && !pendingFile && <DragDropOverlay onCancel={handleCancelDrag} />}
      {pendingFile && (
        <YamlApplyDialog
          file={pendingFile}
          targetApiConfig={activeMcp?.apiConfig ?? null}
          targetName={activeMcp?.name ?? 'Onboarding API'}
          onClose={handleDialogClose}
        />
      )}
    </div>
  );
}
