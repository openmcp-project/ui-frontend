import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useYamlApply } from '../../context/YamlApplyContext';
import { DragDropOverlay } from './DragDropOverlay';
import { YamlApplyDialog } from './YamlApplyDialog';

interface Props {
  children: ReactNode;
}

export const DragDropYamlProvider: FC<Props> = ({ children }) => {
  const { activeMcp, pendingFiles, requestApplyFiles, clearPendingFiles } = useYamlApply();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  // Handler the open dialog registers so drops land in its queue instead of starting a new one.
  const appendRef = useRef<((files: File[]) => void) | null>(null);
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
      // With the dialog open, a drop adds to its existing queue; otherwise it starts a new flow.
      if (dialogOpen && appendRef.current) {
        appendRef.current(Array.from(files));
      } else {
        requestApplyFiles(Array.from(files));
      }
    },
    [requestApplyFiles, dialogOpen],
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

  const registerAppend = useCallback((fn: ((files: File[]) => void) | null) => {
    appendRef.current = fn;
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
          onRegisterAppend={registerAppend}
        />
      )}
    </>
  );
};
