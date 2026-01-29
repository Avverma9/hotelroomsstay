import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setServerStatusCallback, setLoaderCallback, startHealthCheck, stopHealthCheck } from './apiInterceptor';
import { setServerStatus, incrementRetryCount } from '../redux/slices/serverSlice';
import ServerErrorPage from '../components/ServerErrorPage';
import { useLoader } from './loader.jsx';

const ApiInterceptorWrapper = ({ children }) => {
  const dispatch = useDispatch();
  const { isConnected } = useSelector((state) => state.server);
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    // Set up the callback to update Redux store from API interceptor
    setServerStatusCallback((isConnected, errorMessage) => {
      dispatch(setServerStatus({ isConnected, errorMessage }));
      
      if (!isConnected) {
        dispatch(incrementRetryCount());
      }
    });

    // Set up the loader callback
    setLoaderCallback((isLoading) => {
      if (isLoading) {
        showLoader();
      } else {
        hideLoader();
      }
    });

    // DISABLED: Health check causes CORS issues if backend not configured
    // Enable only if your backend has /health endpoint with CORS enabled
    // startHealthCheck(30000);

    // Cleanup on unmount
    return () => {
      stopHealthCheck();
      setServerStatusCallback(null);
      setLoaderCallback(null);
    };
  }, [dispatch, showLoader, hideLoader]);

  // DISABLED: Don't show error page automatically
  // Server status will be managed by actual API call responses
  // if (!isConnected) {
  //   return <ServerErrorPage />;
  // }

  // Always render the app
  return children;
};

export default ApiInterceptorWrapper;
