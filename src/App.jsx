import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeCardapio from './pages/HomeCardapio';
import Login from './pages/Login';
import ClientMenu from './pages/ClientMenu';
import PrintMonitor from './pages/PrintMonitor';
import ProtectedLayout from './components/ProtectedLayout';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomeCardapio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/order/:tableId" element={<ClientMenu />} />
            <Route path="/order" element={<ClientMenu />} />
            <Route path="/menu/:tableId" element={<ClientMenu />} />
            <Route path="/menu" element={<ClientMenu />} />
            <Route path="/print-monitor" element={<PrintMonitor />} />

            {/* Protected Routes - role-based */}
            <Route path="/app/*" element={<ProtectedLayout />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
