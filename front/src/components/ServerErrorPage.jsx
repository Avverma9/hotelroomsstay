import { ServerCrash, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { checkServerHealth } from '../utils/apiInterceptor';
import { resetServerError } from '../redux/slices/serverSlice';
import { useState } from 'react';

const ServerErrorPage = () => {
  const dispatch = useDispatch();
  const { errorMessage, retryCount, lastChecked } = useSelector((state) => state.server);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      const isConnected = await checkServerHealth();
      
      if (isConnected) {
        dispatch(resetServerError());
        // Reload the page to refresh the app state
        window.location.reload();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setTimeout(() => {
        setIsRetrying(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-linear-to-r from-red-500 to-orange-500 p-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <ServerCrash className="w-20 h-20 animate-pulse" />
              <div className="absolute -top-2 -right-2 bg-white rounded-full p-2">
                <WifiOff className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Internal Server Error</h1>
          <p className="text-red-100 text-lg">We're having trouble connecting to the server</p>
        </div>

        {/* Content Section */}
        <div className="p-8">
          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 mb-1">Error Details</h3>
              <p className="text-red-700 text-sm">
                {errorMessage || 'Cannot connect to server. Please check your connection.'}
              </p>
            </div>
          </div>

          {/* Status Information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Retry Attempts</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{retryCount}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Last Checked</span>
              </div>
              <p className="text-sm font-bold text-gray-800">
                {lastChecked ? new Date(lastChecked).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* What to try */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">What you can try:</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>Check your internet connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>Wait a moment and try again</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>Contact support if the problem persists</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>Clear your browser cache and reload</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex-1 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-lg transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry Connection'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
            >
              Reload Page
            </button>
          </div>

          {/* Help Text */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Error Code: 500 | Server Connectivity Issue
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;
