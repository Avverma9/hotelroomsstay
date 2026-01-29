import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './redux/store'
import ApiInterceptorWrapper from './utils/ApiInterceptorWrapper.jsx'
import { LoaderProvider } from './utils/loader.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <LoaderProvider>
        <ApiInterceptorWrapper>
          <App />
        </ApiInterceptorWrapper>
      </LoaderProvider>
    </Provider>
  </StrictMode>,
)
