import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useYamlApply } from '../../context/YamlApplyContext';
import { DragDropOverlay } from './DragDropOverlay';
import { YamlApplyDialog } from './YamlApplyDialog';

interface Props {
  children: ReactNode;
}

export const DragDropYamlProvider: FC<Props> = ({ children }) => {
  const { activeMcp, pendingFiles, requestApplyFiles, clearPendingFiles, registerAppendHandler } = useYamlApply();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const dialogOpen = pendingFiles.length > 0;

  const handleDragEnter = useCallback((e: DragEvent) => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((_e: DragEvent) => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      // `requestApplyFiles` appends to the open dialog's queue (if any) or starts a new flow —
      // the routing lives in the context so a drop and the Upload button behave identically.
      requestApplyFiles(Array.from(files));
    },
    [requestApplyFiles],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDragging) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    },
    [isDragging],
  );

  // Deliberate design decision (see review N4): file drag-and-drop is captured app-wide at the
  // `document` level. This is intentional — it gives the feature a single global entry point so a
  // file can be dropped anywhere to start/extend an apply flow, instead of needing a dedicated drop
  // zone. The trade-off: while the dialog is open, a drop *anywhere over it* (including onto the
  // Monaco editor) routes to the queue via `handleDrop` rather than reaching the editor, so dropping
  // a file onto the editor appends a new resource — it does not replace the edited content. That is
  // the desired behavior here; editing is done by typing, adding is done by dropping/uploading.
  useEffect(() => {
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handleKeyDown]);

  const handleCancel = useCallback(() => {
    dragCounter.current = 0;
    setIsDragging(false);
  }, []);

  return (
    <>
      {children}
      {isDragging && !dialogOpen && <DragDropOverlay onCancel={handleCancel} />}
      {dialogOpen && (
        <YamlApplyDialog
          files={pendingFiles}
          targetApiConfig={activeMcp?.apiConfig ?? null}
          targetName={activeMcp?.name ?? 'Onboarding API'}
          isExternalDragActive={isDragging}
          onClose={clearPendingFiles}
          onRegisterAppend={registerAppendHandler}
        />
      )}
    </>
  );
};
