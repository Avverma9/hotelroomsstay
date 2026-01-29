import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

// --- SVG Icons for different toast severities ---
const SuccessIcon = () => (
  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const InfoIcon = () => (
  <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const WarningIcon = () => (
  <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
  </svg>
);

const severityIcons = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  info: <InfoIcon />,
  warning: <WarningIcon />,
};

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toastConfig, setToastConfig] = useState({
    open: false,
    message: "",
    severity: "success",
    duration: 3000,
  });

  const closeToast = useCallback(() => {
    setToastConfig((prev) => ({ ...prev, open: false }));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const { severity = "success", duration = 5000 } = options;
    setToastConfig({ open: true, message, severity, duration });

    const timer = setTimeout(closeToast, duration);
    return () => clearTimeout(timer);
  }, [closeToast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      <AnimatePresence>
        {toastConfig.open && (
          <motion.div
            key="toast-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={closeToast}
          >
            <motion.div
              key="toast-panel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              <button
                onClick={closeToast}
                className="absolute top-3 right-3 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <CloseIcon />
              </button>

              <div className="flex flex-col items-center justify-center">
                <div className="mb-4">
                  {severityIcons[toastConfig.severity] || <InfoIcon />}
                </div>
                <p className="text-gray-700 text-base whitespace-pre-line">
                  {toastConfig.message}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return {
    success: (msg, opts = {}) => showToast(msg, { severity: "success", ...opts, duration: 5000 }),
    error: (msg, opts = {}) => showToast(msg, { severity: "error", ...opts }),
    info: (msg, opts = {}) => showToast(msg, { severity: "info", ...opts }),
    warning: (msg, opts = {}) => showToast(msg, { severity: "warning", ...opts }),
  };
}
