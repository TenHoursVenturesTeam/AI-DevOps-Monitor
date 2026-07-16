import React from 'react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans antialiased">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#E5E7EB] px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="#2496ED"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="#2496ED"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="#2496ED"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xl font-bold">AI DevOps Monitor</span>
        </div>
        <div className="flex gap-6 items-center">
          <button
            onClick={() => onNavigate('pricing')}
            className="text-gray-500 hover:text-[#2496ED] text-sm transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="text-gray-500 hover:text-[#2496ED] text-sm transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="bg-[#2496ED] hover:bg-[#1D82D0] px-4 py-2 rounded-lg font-semibold text-sm text-white shadow-sm transition-all duration-200"
          >
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-8">
        <div className="inline-block bg-[#2496ED]/10 border border-[#2496ED]/20 text-[#2496ED] px-4 py-1 rounded-full text-sm mb-6 font-semibold">
          Docker-ready monitoring with smart optimization
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Predict Docker Crashes
          <br />
          <span className="text-[#2496ED]">Before They Happen</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Monitor all your Docker containers in real-time. Get early crash alerts and automated remediation insights.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => onNavigate('login')}
            className="bg-[#2496ED] hover:bg-[#1D82D0] px-8 py-3 rounded-xl font-bold text-lg text-white shadow-sm transition-all duration-200"
          >
            Start Free 14-Day Trial
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className="border border-gray-200 hover:border-[#2496ED] px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 bg-white shadow-sm"
          >
            View Live Demo
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto px-8 mb-20">
        {[
          { value: '5-10 min', label: 'Early Crash Warning' },
          { value: 'Real-time', label: 'Container Monitoring' },
          { value: 'Automated', label: 'Security Scanning' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl p-6 text-center border border-[#E5E7EB] shadow-sm"
          >
            <div className="text-3xl font-bold text-green-600 mb-2">{s.value}</div>
            <div className="text-gray-500 text-sm">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '📊',
              title: 'Real-time Monitoring',
              desc: 'Check all Docker containers 24/7 with live CPU, memory & health metrics',
            },
            {
              icon: '🤖',
              title: 'Crash Prediction',
              desc: 'Get early signals for potential crashes before they happen',
            },
            { icon: '⚡', title: 'Auto-Fix Issues', desc: 'Use safe remediation actions to stabilize containers' },
            { icon: '🔔', title: 'Smart Alerts', desc: 'Notification channels for critical events and trends' },
            { icon: '💰', title: 'Cost Optimization', desc: 'Identify wasted resources and reduce spend' },
            { icon: '🛡️', title: 'Security Scanner', desc: 'Find exposed ports and vulnerability signals' },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:border-[#2496ED]/40 transition-colors shadow-sm"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Stop Docker Crashes?</h2>
          <p className="text-gray-500 mb-8">Start monitoring your Docker infrastructure today</p>
          <button
            onClick={() => onNavigate('login')}
            className="bg-[#2496ED] hover:bg-[#1D82D0] px-10 py-4 rounded-xl font-bold text-lg text-white shadow-sm transition-all duration-200"
          >
            Start Free Trial — No Credit Card Required
          </button>
        </div>
      </section>

      <footer className="text-center py-6 text-gray-500 text-sm bg-[#F9FAFB]">
        © 2024 AI DevOps Monitor | Built with React + Node.js + Python AI
      </footer>
    </div>
  );
}

