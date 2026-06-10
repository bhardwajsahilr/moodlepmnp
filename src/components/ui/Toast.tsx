import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  show: boolean;
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  error: <XCircle className="w-5 h-5 text-red-600" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-secondary" />,
};

const toastClasses: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-secondary-50 border-secondary/30 text-secondary-600',
};

export function Toast({ show, message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, duration);
      return () => clearTimeout(t);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[280px] max-w-[420px]"
          style={{ backdropFilter: 'blur(8px)' }}
          role="alert"
        >
          <span className={`flex items-center gap-3 flex-1 text-sm font-medium ${toastClasses[type]}`} style={{ background: 'transparent', border: 'none' }}>
            {icons[type]}
            {message}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useToast() {
  const [toast, setToast] = React.useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => setToast((t) => ({ ...t, show: false }));

  return { toast, showToast, hideToast };
}
