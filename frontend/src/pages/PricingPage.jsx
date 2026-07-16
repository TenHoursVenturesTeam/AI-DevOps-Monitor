import React from 'react';

const plans = [
  {
    name: 'Free Trial',
    price: '₹0',
    period: '14 days',
    color: 'slate',
    features: ['All features', '5 containers', 'Email alerts', 'Crash prediction', 'Dashboard access'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Starter',
    price: '₹5,000',
    period: '/month',
    color: 'cyan',
    features: ['20 containers', 'Email alerts', 'Crash prediction', 'Auto-restart', 'Cost optimization'],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Professional',
    price: '₹10,000',
    period: '/month',
    color: 'purple',
    features: ['100 containers', 'SMS + Email alerts', 'Auto-fix issues', 'Security scanner', 'Priority support'],
    cta: 'Go Pro',
  },
  {
    name: 'Enterprise',
    price: '₹25,000',
    period: '/month',
    color: 'orange',
    features: [
      'Unlimited containers',
      'All alert channels',
      'Security scanner',
      'API access',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
  },
];

export default function PricingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans antialiased">
      <nav className="bg-white border-b border-[#E5E7EB] px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => onNavigate('landing')}
          className="text-gray-500 hover:text-[#2496ED] text-sm font-semibold transition-colors"
        >
          ← Home
        </button>
        <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-[#2496ED] font-bold text-xl transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          AI DevOps Monitor
        </button>
        <button
          onClick={() => onNavigate('login')}
          className="bg-[#2496ED] hover:bg-[#1D82D0] px-4 py-2 rounded-lg font-semibold text-sm text-white shadow-sm transition-all duration-200"
        >
          Start Free Trial
        </button>
      </nav>

      <section className="text-center py-16 px-8">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-gray-500 text-lg">Start free. Scale as you grow. Cancel anytime.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-8 pb-20">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-white rounded-2xl border p-6 flex flex-col shadow-sm transition-all ${
              plan.popular
                ? 'border-[#2496ED]/50 shadow-[#2496ED]/20'
                : 'border-[#E5E7EB]'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2496ED] text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                MOST POPULAR
              </div>
            )}

            <h3 className="font-bold text-lg mb-2">{plan.name}</h3>

            <div className="mb-4">
              <span className="text-3xl font-bold text-[#2496ED]">{plan.price}</span>
              <span className="text-gray-500 text-sm ml-2">{plan.period}</span>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-600">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onNavigate('login')}
              className={`w-full py-2 rounded-lg font-semibold transition-colors text-sm shadow-sm ${
                plan.popular
                  ? 'bg-[#2496ED] hover:bg-[#1D82D0] text-white'
                  : 'bg-white hover:bg-[#2496ED]/10 text-[#2496ED] border border-[#E5E7EB]'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

