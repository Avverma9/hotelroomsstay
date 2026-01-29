import { useState, useCallback } from 'react';

export const useLoader = () => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = useCallback(() => {
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    showLoader,
    hideLoader,
  };
};
