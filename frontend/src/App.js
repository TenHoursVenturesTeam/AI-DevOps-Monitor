import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PricingPage from './pages/PricingPage';

export default function App() {
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(null);

  const navigate = (p) => setPage(p);

  const handleLogin = (user) => {
    setUser(user);
    setPage('dashboard');
  };

  if (page === 'landing') return <LandingPage onNavigate={navigate} />;
  if (page === 'login') return <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
  if (page === 'dashboard') return <Dashboard user={user} onNavigate={navigate} />;
  if (page === 'pricing') return <PricingPage onNavigate={navigate} />;
  return <LandingPage onNavigate={navigate} />;
}
