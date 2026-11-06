import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import type { ToastType } from '../types';

interface Toast { id: string; message: string; type: ToastType }
const ToastContext = createContext<{ showToast: (message: string, type?: ToastType) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4000);
  }, []);
  return <ToastContext.Provider value={{ showToast }}>{children}<div className="toast-stack" aria-live="polite">{toasts.map((toast) => {
    const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? CircleAlert : Info;
    return <div className={`toast toast-${toast.type}`} key={toast.id}><Icon /><span>{toast.message}</span><button type="button" onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))} aria-label="Bildirimi kapat"><X /></button></div>;
  })}</div></ToastContext.Provider>;
}

export function useToast() { const value = useContext(ToastContext); if (!value) throw new Error('useToast, ToastProvider içinde kullanılmalıdır.'); return value; }
