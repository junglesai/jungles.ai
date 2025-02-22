import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'loading';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-yellowgreen-500' : type === 'loading' ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50`}>
      <span>{"{"} {message} {"}"}</span>
      <button onClick={onClose} className="ml-2 hover:text-gray-200">×</button>
    </div>
  );
};

export default Toast; 