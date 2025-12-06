'use client';

import { cn } from '@/lib/utils/cn';
import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { StatusBadge } from './status-badge';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  icon?: ReactNode;
}

export function Toast({ message, type = 'info', duration = 5000, onClose, icon }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const toastContent = (
    <div
      className={cn(
        'glass-lg px-6 py-4 rounded-xl shadow-glass-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-up',
        !isVisible && 'animate-fade-out opacity-0'
      )}
    >
      {icon || (
        <StatusBadge status={type} variant="icon">
          {type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {type === 'error' && <XCircle className="w-4 h-4" />}
          {type === 'warning' && <AlertTriangle className="w-4 h-4" />}
          {type === 'info' && <Info className="w-4 h-4" />}
        </StatusBadge>
      )}
      <p className="text-white flex-1">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-gray-400 hover:text-white transition-colors"
        aria-label="Close toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toastContent}
      </div>,
      document.body
    );
  }
  return null;
}

// Toast manager hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; props: Omit<ToastProps, 'onClose'> }>>(
    []
  );

  const showToast = (props: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, props }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    showToast,
    ToastContainer: () => (
      <>
        {toasts.map(({ id, props }) => (
          <Toast key={id} {...props} onClose={() => removeToast(id)} />
        ))}
      </>
    ),
  };
}

