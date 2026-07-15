import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomeCardapio from './pages/HomeCardapio';
import ErrorBoundary from './components/ErrorBoundary';

const Login = lazy(() => import('./pages/Login'));
const ProtectedLayout = lazy(() => import('./components/ProtectedLayout'));
const ComandaView = lazy(() => import('./pages/ComandaView'));

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
              <Route path="/comanda/:codigo" element={<ComandaView />} />
              <Route path="/app/*" element={<ProtectedLayout />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
