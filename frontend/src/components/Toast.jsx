import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertTriangle size={20} />;
      case 'info':
      default:
        return <Info size={20} />;
    }
  };

  const getClassName = () => {
    switch (type) {
      case 'success':
        return 'toast toast-success';
      case 'error':
        return 'toast toast-error';
      case 'info':
      default:
        return 'toast toast-info';
    }
  };

  return (
    <div className={getClassName()}>
      {getIcon()}
      <span>{message}</span>
      <button 
        onClick={onClose} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: '#fff', 
          cursor: 'pointer', 
          padding: 0, 
          marginLeft: '8px', 
          display: 'flex', 
          alignItems: 'center',
          opacity: 0.8
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
