import React, { useState } from 'react';

// Detect backend based on current location to prevent "Cannot connect" errors
const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5003/api`;

export default function LoginPage({ onLogin, onNavigate }) {
  const [isSignup, setIsSignup] = useState(true);
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isSignup ? '/auth/register' : '/auth/login';
      const body = isSignup 
        ? { name: fullName, email: emailInput, password: passInput, role: 'viewer' } 
        : { email: emailInput, password: passInput };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (isSignup) {
          alert('Registration successful! Please login.');
          setIsSignup(false);
          return;
        }

        // Backend data ko carefully handle karein
        const raw = data.user || {};
        
        // Ensure email is a string and not empty
        let userEmail = "";
        if (typeof raw === 'string') {
          userEmail = raw;
        } else if (raw && raw.email) {
          userEmail = String(raw.email);
        } else {
          userEmail = String(emailInput || "");
        }

        const authUser = {
          email: String(userEmail),
          name: String(raw.name || (String(userEmail).includes('@') ? String(userEmail).split('@')[0] : 'User')),
          role: String(userEmail === 'admin@test.com' ? 'admin' : (raw.role || 'viewer'))
        };
        if (authUser.role === 'user') authUser.role = 'viewer';

        console.log("Secure Login Success. Data sent to App.js:", authUser);
        localStorage.setItem('token', data.token);
        onLogin(authUser);
      } else {
        // Backend returned an error status (e.g., 400, 401, 500)
        setError(data.message || `Login failed with status ${res.status}. Please check your credentials.`);
      }
    } catch (err) {
      console.error("Detailed Fetch Error:", err);
      if (err instanceof SyntaxError) { // JSON parsing error
        setError('Server returned invalid data. Check backend console for errors.');
      } else if (err.name === 'TypeError' && err.message === 'Failed to fetch') { // Network connection error
        setError('Cannot connect to Backend. Is the server running and accessible?');
      } else { // Other unexpected errors during fetch
        setError(`An unexpected error occurred: ${err.message || 'Unknown error'}.`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col items-center justify-center p-6 antialiased selection:bg-[#2496ED]/30 font-sans">

      <div className="w-full max-w-[420px] space-y-8">
        <div className="flex flex-col items-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-6">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#2496ED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#2496ED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#2496ED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="text-3xl font-bold tracking-tighter text-[#111827]">Console</h1>
          <p className="text-[#6B7280] text-sm mt-2 font-medium">Manage and predict container infrastructure</p>

        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 relative overflow-hidden">
          <div className="flex border-b border-gray-200 mb-8">



            <button onClick={() => setIsSignup(true)} className={`pb-4 px-2 text-sm font-semibold transition-all relative ${isSignup ? 'text-[#2496ED]' : 'text-slate-500 hover:text-slate-300'}`}>
              Registration
              {isSignup && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2496ED]"></div>}
            </button>
            <button onClick={() => setIsSignup(false)} className={`pb-4 px-6 text-sm font-semibold transition-all relative ${!isSignup ? 'text-[#2496ED]' : 'text-slate-500 hover:text-slate-300'}`}>
              Sign In
              {!isSignup && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2496ED]"></div>}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-900/50 text-red-400 text-[11px] p-3 rounded-md mb-6 text-center font-medium">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Identity</label>
                <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required 
                  className="w-full bg-white border border-gray-200 rounded-md px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 focus:outline-none focus:border-[#2496ED] transition-all" />

              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Terminal Access</label>
              <input type="email" placeholder="Email Address" value={emailInput} onChange={e => setEmailInput(e.target.value)} required
                className="w-full bg-white border border-gray-200 rounded-md px-4 py-2.5 text-sm text-[#111827] font-mono placeholder-gray-400 focus:outline-none focus:border-[#2496ED] transition-all" />

            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Secret Key</label>
              <input type="password" placeholder="Password" value={passInput} onChange={e => setPassInput(e.target.value)} required
                className="w-full bg-white border border-gray-200 rounded-md px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 focus:outline-none focus:border-[#2496ED] transition-all" />

            </div>
            <button type="submit" className="w-full bg-[#2496ED] hover:bg-[#1d82d0] py-2.5 rounded-md font-semibold text-sm text-white transition-all active:scale-[0.98]">
              {isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>

            <button onClick={() => onNavigate('landing')} className="flex items-center justify-center gap-2 text-gray-500 hover:text-[#2496ED] text-xs font-medium w-full transition-colors">
              <span className="text-lg">←</span> Back to home
            </button>

      </div>
    </div>
  );
}
