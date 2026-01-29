import React, { createContext, useContext, useState } from "react";

const LoaderContext = createContext(null);

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  return (
    <LoaderContext.Provider value={{ loading, showLoader, hideLoader }}>
      {children}

      {loading && (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/60 backdrop-blur-sm">
          {/* Single sized wrapper = alignment stable */}
          <div className="relative h-24 w-24">
            {/* Outer spinning ring perfectly centered */}
            <div className="absolute inset-0 rounded-full border-[4px] border-blue-500/30 border-t-blue-500 animate-spin" />

            {/* Inner logo circle perfectly centered */}
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-20 w-20 rounded-full bg-white shadow-lg shadow-blue-500/20 p-3 grid place-items-center">
                <img
                  src="/logo.png"
                  alt="Loading"
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);
