import { useNavigate } from 'react-router';
import { Search, BookOpen, BarChart3, Zap, ArrowRight, Check } from 'lucide-react';

const features = [
  { icon: Search, title: 'Multi-Source Search', desc: 'Search across arXiv and Google Scholar simultaneously. Find relevant papers in seconds with intelligent ranking.' },
  { icon: BookOpen, title: 'Research Library', desc: 'Save papers, organize into collections, add notes and tags. Your personal research workspace.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track publication trends, citation patterns, and emerging topics in your field.' },
];

const stats = [
  { value: '130M+', label: 'Papers Indexed' },
  { value: '2', label: 'Data Sources' },
  { value: '50K+', label: 'Researchers' },
  { value: '12M+', label: 'Searches' },
];

const plans = [
  { name: 'Free', price: '$0', period: '/month', desc: 'For individual researchers', features: ['10 searches/day', 'Basic filters', '50 paper library', '1 collection', 'CSV export'] },
  { name: 'Pro', price: '$9', period: '/month', desc: 'For serious researchers', featured: true, features: ['Unlimited searches', 'Advanced filters', 'Unlimited library', 'Unlimited collections', 'All export formats', 'Analytics dashboard', 'Trend alerts', 'Priority support'] },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#08080C]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0F0F14]/80 backdrop-blur-md border-b border-[#23232D]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <BookOpen size={20} className="text-[#6366F1]" />
            <span className="font-semibold text-[#F0F0F5]">ScholarMap</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <button onClick={() => navigate('/app')} className="text-[#8A8A98] hover:text-[#F0F0F5] transition-colors">Dashboard</button>
            <button onClick={() => navigate('/app/library')} className="text-[#8A8A98] hover:text-[#F0F0F5] transition-colors">Library</button>
            <button onClick={() => navigate('/app/analytics')} className="text-[#8A8A98] hover:text-[#F0F0F5] transition-colors">Analytics</button>
            <button onClick={() => navigate('/pricing')} className="text-[#8A8A98] hover:text-[#F0F0F5] transition-colors">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm text-[#8A8A98] hover:text-[#F0F0F5]">Sign in</button>
            <button onClick={() => navigate('/app')} className="text-sm px-4 py-1.5 rounded-lg bg-[#6366F1] text-white hover:bg-[#818CF8] transition-colors">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#6366F1]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#818CF8] text-xs font-medium mb-6">
            <Zap size={12} /> Powered by real academic data
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#F0F0F5] mb-6">
            Your Research,<br />
            <span className="text-[#6366F1]">Mapped</span>
          </h1>
          <p className="text-lg text-[#8A8A98] max-w-2xl mx-auto mb-10">
            Search across millions of academic papers. Organize your research.
            Discover trends. All in one beautiful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/app')} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6366F1] text-white font-medium hover:bg-[#818CF8] transition-all hover:shadow-lg hover:shadow-[#6366F1]/20">
              <Search size={18} /> Start Searching
            </button>
            <button onClick={() => navigate('/pricing')} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#23232D] text-[#F0F0F5] font-medium hover:bg-[#16161D] transition-all">
              View Pricing <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-[#23232D] bg-[#0F0F14]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-[#F0F0F5]">{s.value}</div>
              <div className="text-sm text-[#5A5A68] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#F0F0F5] mb-4">Everything you need for research</h2>
            <p className="text-[#8A8A98] max-w-xl mx-auto">From discovery to organization, ScholarMap streamlines your entire research workflow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-[#16161D] border border-[#23232D] hover:border-[#2E2E3A] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center mb-4 group-hover:bg-[#6366F1]/20 transition-colors">
                  <Icon size={20} className="text-[#6366F1]" />
                </div>
                <h3 className="text-lg font-semibold text-[#F0F0F5] mb-2">{title}</h3>
                <p className="text-sm text-[#8A8A98] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6 bg-[#0F0F14]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#F0F0F5] mb-4">Simple pricing</h2>
            <p className="text-[#8A8A98]">Start free, upgrade when you need more power.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`p-6 rounded-2xl border ${plan.featured ? 'border-[#6366F1]/30 bg-[#16161D] shadow-lg shadow-[#6366F1]/5' : 'border-[#23232D] bg-[#16161D]'} relative`}>
                {plan.featured && <span className="absolute -top-3 left-6 px-3 py-0.5 bg-[#6366F1] text-white text-xs font-medium rounded-full">Most Popular</span>}
                <h3 className="text-lg font-semibold text-[#F0F0F5]">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-1">
                  <span className="text-3xl font-bold text-[#F0F0F5]">{plan.price}</span>
                  <span className="text-sm text-[#5A5A68]">{plan.period}</span>
                </div>
                <p className="text-sm text-[#8A8A98] mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#8A8A98]">
                      <Check size={14} className="text-[#22C55E] shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/app')} className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${plan.featured ? 'bg-[#6366F1] text-white hover:bg-[#818CF8]' : 'border border-[#23232D] text-[#F0F0F5] hover:bg-[#1E1E28]'}`}>
                  {plan.featured ? 'Start Pro Trial' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#F0F0F5] mb-4">Ready to accelerate your research?</h2>
          <p className="text-[#8A8A98] mb-8">Join thousands of researchers who trust ScholarMap for their academic discovery.</p>
          <button onClick={() => navigate('/app')} className="px-8 py-3 rounded-xl bg-[#6366F1] text-white font-medium hover:bg-[#818CF8] transition-all hover:shadow-lg hover:shadow-[#6366F1]/20">
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#23232D] bg-[#0F0F14] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-[#6366F1]" />
            <span className="font-semibold text-[#F0F0F5]">ScholarMap</span>
          </div>
          <p className="text-sm text-[#5A5A68] mb-8">Academic research, reimagined.</p>
          <div className="border-t border-[#23232D] pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#5A5A68]">2026 ScholarMap. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-[#5A5A68]">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
