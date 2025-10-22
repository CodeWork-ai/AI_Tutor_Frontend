import { useState, useCallback } from 'react';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    setToasts((currentToasts) => [...currentToasts, options]);
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((currentToasts) => 
        currentToasts.filter((t) => t !== options)
      );
    }, 5000);
  }, []);

  return { toast, toasts };
};