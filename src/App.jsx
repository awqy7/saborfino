import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeCardapio from './pages/HomeCardapio';
import ErrorBoundary from './components/ErrorBoundary';

const Login = lazy(() => import('./pages/Login'));
const ClientMenu = lazy(() => import('./pages/ClientMenu'));
const PrintMonitor = lazy(() => import('./pages/PrintMonitor'));
const ProtectedLayout = lazy(() => import('./components/ProtectedLayout'));

const LoadingFallback = () => (
  <div className="loading">
    <div className="loading-spinner" />
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app-container">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomeCardapio />} />
              <Route path="/login" element={<Login />} />
              <Route path="/order/:tableId" element={<ClientMenu />} />
              <Route path="/order" element={<ClientMenu />} />
              <Route path="/menu/:tableId" element={<ClientMenu />} />
              <Route path="/menu" element={<ClientMenu />} />
              <Route path="/print-monitor" element={<PrintMonitor />} />
              <Route path="/app/*" element={<ProtectedLayout />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
