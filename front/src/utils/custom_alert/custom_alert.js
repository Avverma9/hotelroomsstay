import toast from 'react-hot-toast';

// Simple alert wrapper using react-hot-toast
const alert = (message, type = 'info') => {
  if (typeof message === 'string') {
    if (type === 'error' || message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
      toast.error(message);
    } else if (type === 'success' || message.toLowerCase().includes('success')) {
      toast.success(message);
    } else {
      toast(message);
    }
  } else {
    toast(String(message));
  }
};

export default alert;
