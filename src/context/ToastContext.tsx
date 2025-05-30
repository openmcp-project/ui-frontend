import { Toast } from '@ui5/webcomponents-react';
import { FC, ReactNode, createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type ToastContent = {
  text: string;
  duration?: number;
};

interface ToastContextType {
  show: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const c = useContext(ToastContext);
  const { t } = useTranslation();

  if (!c) {
    throw new Error(t('ToastContext.errorMessage'));
  }
  return c;
};

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toastContent, setToastContent] = useState<ToastContent | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const show = (message: string, duration?: number) => {
    if (!message) return;

    setToastVisible(false);

    setTimeout(() => {
      setToastContent({
        text: message,
        duration: duration || 8000,
      });
      setToastVisible(true);
    }, 100);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      <Toast
        open={toastVisible}
        duration={toastContent?.duration}
        onClose={() => {
          setToastVisible(false);
        }}
      >
        {toastContent?.text}
      </Toast>
      {children}
    </ToastContext.Provider>
  );
};
