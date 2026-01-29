import React, { createContext, useContext, useState } from "react";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/system";

const LoaderContext = createContext();

const spin = keyframes`
  0% { transform: rotate(0deg) rotateY(0deg); }
  100% { transform: rotate(360deg) rotateY(360deg); }
`;

const pulsate = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  return (
    <LoaderContext.Provider value={{ loading, showLoader, hideLoader }}>
      {children}
      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(107, 107, 107, 0.6)",
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: 100,
              height: 100,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              perspective: "800px",
            }}
          >
            {/* Spinning 3D Ring */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                border: "4px solid transparent",
                borderTopColor: "rgba(0, 123, 255, 0.8)",
                borderBottomColor: "rgba(255, 60, 0, 0.8)",
                animation: `${spin} 2s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite`,
                boxShadow:
                  "0 0 15px rgba(0, 123, 255, 0.7), inset 0 0 15px rgba(0, 123, 255, 0.5)",
              }}
            />
            {/* Inner Circle with Pulsating Glow */}
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                zIndex: 10000,
                boxShadow: "0 0 20px rgba(0, 123, 255, 0.6)",
                animation: `${pulsate} 1.5s ease-in-out infinite`,
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  transform: "scale(1.2)",
                  filter: "blur(20px)",
                  opacity: 0,
                  transition: "opacity 0.5s ease",
                },
              }}
            >
              {/* Logo */}
              <img
                src="/logo.png"
                alt="Loading..."
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  userSelect: "none",
                }}
              />
            </Box>
          </Box>
        </Box>
      )}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => {
  return useContext(LoaderContext);
};