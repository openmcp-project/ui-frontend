import {
  createContext,
  useContext,
  useState,
  useRef,
  FC,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';

const DURATION = 2000; //ms

interface CopyButtonContextType {
  activeCopyId: string | null;
  setActiveCopyId: (text: string | null) => void;
}

const CopyButtonContext = createContext<CopyButtonContextType>({
  activeCopyId: null,
  setActiveCopyId: () => {},
});

export const CopyButtonProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeCopyId, setActiveCopyId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSetActiveCopyId = (text: string | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setActiveCopyId(text);

    if (text) {
      timeoutRef.current = setTimeout(() => {
        setActiveCopyId(null);
        timeoutRef.current = null;
      }, DURATION);
    }
  };

  return (
    <CopyButtonContext.Provider
      value={{ activeCopyId, setActiveCopyId: handleSetActiveCopyId }}
    >
      {children}
    </CopyButtonContext.Provider>
  );
};

export const useCopyButton = () => {
  const context = useContext(CopyButtonContext);
  const { t } = useTranslation();

  if (!context) {
    throw new Error(t('CopyButtonContext.errorMessage'));
  }
  return context;
};
