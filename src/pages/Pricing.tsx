import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Check,
  X,
  GraduationCap,
  Zap,
  Users,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const billingMonthly = {
  free: 0,
  pro: 9,
  team: 29,
};

const billingYearly = {
  free: 0,
  pro: 7,
  team: 23,
};

const faqs = [
  {
    q: "Can I really use ScholarMap for free?",
    a: "Absolutely. Our Free plan includes 100 searches per month, 50 saved papers, and 3 collections. It's designed to give individual researchers a powerful tool without any cost. Upgrade only when you need more.",
  },
  {
    q: "What happens when I reach my search limit?",
    a: "You'll see a friendly notification when you're at 80% of your limit. Once reached, you can still browse your library and view analytics — you just won't be able to perform new searches until your limit resets at the start of the next month.",
  },
  {
    q: "Can I cancel my Pro subscription anytime?",
    a: "Yes, you can cancel at any time from your Settings page. Your Pro features will remain active until the end of your current billing period. We also offer a 14-day free trial with no credit card required.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual Team plans. All payments are processed securely through Stripe.",
  },
  {
    q: "Is my research data private?",
    a: "Your library, notes, and search history are completely private and never shared. We only use anonymized, aggregate data to improve search relevance and analytics accuracy. See our Privacy Policy for full details.",
  },
  {
    q: "Can I switch between monthly and annual billing?",
    a: "Yes, you can switch at any time from your subscription settings. When switching from monthly to annual, we'll credit any remaining days. When switching to monthly, the change takes effect at your next renewal.",
  },
  {
    q: "Do you offer discounts for students or institutions?",
    a: "Yes! We offer a 50% student discount with a valid .edu email. Institutions and universities can contact us for volume licensing and site-wide access at reduced rates.",
  },
];

const featureCategories = [
  {
    name: "Search",
    features: [
      { name: "Monthly searches", free: "100", pro: "Unlimited", team: "Unlimited" },
      { name: "Search sources", free: "2 (arXiv, Scholar)", pro: "4", team: "4" },
      { name: "Advanced filters", free: false, pro: true, team: true },
      { name: "Saved searches", free: "3", pro: "Unlimited", team: "Unlimited" },
      { name: "Search alerts", free: false, pro: true, team: true },
    ],
  },
  {
    name: "Library",
    features: [
      { name: "Saved papers", free: "50", pro: "Unlimited", team: "Unlimited" },
      { name: "Collections", free: "3", pro: "Unlimited", team: "Unlimited" },
      { name: "Notes per paper", free: false, pro: true, team: true },
      { name: "Tags", free: "Basic", pro: "Advanced", team: "Advanced" },
      { name: "Paper upload (PDF)", free: false, pro: "10/month", team: "50/month" },
    ],
  },
  {
    name: "Analytics",
    features: [
      { name: "Basic trends", free: true, pro: true, team: true },
      { name: "Citation analysis", free: false, pro: true, team: true },
      { name: "Author rankings", free: false, pro: true, team: true },
      { name: "Venue analysis", free: false, pro: true, team: true },
      { name: "Topic network", free: false, pro: true, team: true },
      { name: "Custom reports", free: false, pro: true, team: true },
      { name: "Export charts", free: false, pro: "PNG", team: "PNG, SVG" },
    ],
  },
  {
    name: "Export",
    features: [
      { name: "BibTeX", free: true, pro: true, team: true },
      { name: "RIS", free: false, pro: true, team: true },
      { name: "EndNote", free: false, pro: true, team: true },
      { name: "CSV", free: false, pro: true, team: true },
      { name: "API access", free: false, pro: "1,000/day", team: "10,000/day" },
    ],
  },
  {
    name: "Collaboration",
    features: [
      { name: "Team members", free: false, pro: false, team: "10" },
      { name: "Shared library", free: false, pro: false, team: true },
      { name: "Comments", free: false, pro: false, team: true },
      { name: "Activity feed", free: false, pro: false, team: true },
    ],
  },
  {
    name: "Support",
    features: [
      { name: "Email support", free: true, pro: true, team: true },
      { name: "Priority support", free: false, pro: true, team: true },
      { name: "Dedicated rep", free: false, pro: false, team: true },
      { name: "SLA", free: false, pro: false, team: true },
    ],
  },
];

const freeFeatures = [
  "100 searches per month",
  "50 saved papers",
  "3 collections",
  "Basic analytics",
  "BibTeX export",
];

const freeMissing = [
  "Advanced analytics",
  "Citation trends",
  "Topic networks",
  "Team collaboration",
  "API access",
];

const proFeatures = [
  "Unlimited searches",
  "Unlimited saved papers",
  "Unlimited collections",
  "Advanced analytics & trends",
  "Citation distribution charts",
  "Topic network visualization",
  "Export to BibTeX, RIS, EndNote",
  "Priority search indexing",
  "API access (1,000 req/day)",
];

const teamFeatures = [
  "Everything in Pro",
  "Up to 10 team members",
  "Shared team library",
  "Collaborative collections",
  "Team analytics dashboard",
  "SSO / SAML authentication",
  "Dedicated support",
  "API access (10,000 req/day)",
  "Custom integrations",
];

function FeatureIcon({
  icon: Icon,
  color,
  bg,
}: {
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
      style={{ background: bg }}
    >
      <Icon className="size-6" style={{ color }} />
    </div>
  );
}

function FeatureRow({
  name,
  free,
  pro,
  team,
}: {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  team: string | boolean;
}) {
  const renderValue = (val: string | boolean) => {
    if (val === true)
      return <Check className="size-5 text-[#22C55E] mx-auto" />;
    if (val === false)
      return <X className="size-5 text-[#5A5A68]/40 mx-auto" />;
    return (
      <span className="text-xs text-[#8A8A98] font-medium">{val}</span>
    );
  };

  return (
    <tr className="border-b border-[#23232D] last:border-b-0">
      <td className="px-4 py-3 text-sm text-[#F0F0F5]">{name}</td>
      <td className="px-4 py-3 text-center">{renderValue(free)}</td>
      <td className="px-4 py-3 text-center bg-[#6366F1]/5">
        {renderValue(pro)}
      </td>
      <td className="px-4 py-3 text-center">{renderValue(team)}</td>
    </tr>
  );
}

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const prices = isYearly ? billingYearly : billingMonthly;
  const navigate = useNavigate();
  const checkout = trpc.stripe.createCheckout.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });

  const handleProCheckout = () => {
    checkout.mutate();
  };

  const handleGetStarted = () => {
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-[#08080C]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-12 border-b border-[#23232D] bg-[#08080C]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-[#6366F1]" />
          <span className="text-lg font-bold text-[#F0F0F5]">ScholarMap</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-[#8A8A98]">
          <a href="/" className="hover:text-[#F0F0F5] transition-colors">
            Features
          </a>
          <a href="/pricing" className="text-[#F0F0F5] font-medium">
            Pricing
          </a>
          <a href="/" className="hover:text-[#F0F0F5] transition-colors">
            Docs
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-[#8A8A98] hover:text-[#F0F0F5] hover:bg-[#1E1E28]"
          >
            Sign In
          </Button>
          <Button className="bg-[#6366F1] hover:bg-[#818CF8] text-white">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-10 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-2xl mx-auto">
          <span className="inline-block text-[#6366F1] text-xs font-medium tracking-[0.1em] uppercase mb-4">
            Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#F0F0F5] tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-[#8A8A98] max-w-lg mx-auto">
            Start free and upgrade when you need more power. No hidden fees, no
            surprises. Cancel anytime.
          </p>
          <p className="text-xs text-[#6366F1] mt-3 font-medium">
            50% student discount available with .edu email
          </p>
        </div>
      </section>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-10 px-6">
        <div className="inline-flex items-center bg-[#0F0F14] border border-[#23232D] rounded-xl p-1">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              !isYearly
                ? "bg-[#16161D] text-[#F0F0F5] shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                : "text-[#5A5A68] hover:text-[#8A8A98]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isYearly
                ? "bg-[#16161D] text-[#F0F0F5] shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                : "text-[#5A5A68] hover:text-[#8A8A98]"
            }`}
          >
            Yearly
            <Badge className="bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-semibold hover:bg-[#22C55E]/20">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-[#0F0F14] border border-[#23232D] rounded-xl p-8 flex flex-col">
            <FeatureIcon
              icon={GraduationCap}
              color="#5A5A68"
              bg="rgba(90,90,104,0.12)"
            />
            <h3 className="text-2xl font-bold text-[#F0F0F5] mb-1">Free</h3>
            <p className="text-sm text-[#8A8A98] mb-6">
              Perfect for individual researchers getting started.
            </p>
            <div className="border-t border-[#23232D] pt-6 mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#F0F0F5] font-mono">
                  $0
                </span>
                <span className="text-sm text-[#8A8A98]">/month</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full h-11 border-[#23232D] text-[#F0F0F5] hover:bg-[#1E1E28] hover:text-[#F0F0F5] mb-6"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
            <ul className="space-y-3 flex-1">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#8A8A98]">
                  <Check className="size-4 text-[#22C55E] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
              {freeMissing.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm text-[#5A5A68]"
                >
                  <X className="size-4 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro - Featured */}
          <div className="relative bg-[#16161D] border border-[#6366F1] rounded-2xl p-8 flex flex-col shadow-[0_8px_32px_rgba(99,102,241,0.15)]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-[#6366F1] text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-[#6366F1]">
                Most Popular
              </Badge>
            </div>
            <FeatureIcon
              icon={Zap}
              color="#6366F1"
              bg="rgba(99,102,241,0.12)"
            />
            <h3 className="text-2xl font-bold text-[#F0F0F5] mb-1">Pro</h3>
            <p className="text-sm text-[#8A8A98] mb-6">
              For serious researchers who need the full picture.
            </p>
            <div className="border-t border-[#23232D] pt-6 mb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#F0F0F5] font-mono">
                  ${prices.pro}
                </span>
                <span className="text-sm text-[#8A8A98]">/month</span>
              </div>
              <p className="text-[11px] text-[#5A5A68] mt-1 mb-5">
                {isYearly ? "Billed annually ($84/year)" : "Billed monthly"}
              </p>
            </div>
            <Button
              className="w-full h-12 bg-[#6366F1] hover:bg-[#818CF8] text-white text-base font-medium mb-2"
              onClick={handleProCheckout}
              disabled={checkout.isPending}
            >
              {checkout.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Start Pro Trial"
              )}
            </Button>
            <p className="text-[11px] text-[#5A5A68] text-center mb-6">
              14-day free trial, no credit card required
            </p>
            <ul className="space-y-3 flex-1">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#8A8A98]">
                  <Check className="size-4 text-[#6366F1] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Team */}
          <div className="bg-[#0F0F14] border border-[#23232D] rounded-xl p-8 flex flex-col">
            <FeatureIcon
              icon={Users}
              color="#06B6D4"
              bg="rgba(6,182,212,0.12)"
            />
            <h3 className="text-2xl font-bold text-[#F0F0F5] mb-1">Team</h3>
            <p className="text-sm text-[#8A8A98] mb-6">
              For research labs and collaborative teams.
            </p>
            <div className="border-t border-[#23232D] pt-6 mb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#F0F0F5] font-mono">
                  ${prices.team}
                </span>
                <span className="text-sm text-[#8A8A98]">/user/mo</span>
              </div>
              <p className="text-[11px] text-[#5A5A68] mt-1 mb-5">
                Per team, {isYearly ? "billed annually" : "billed monthly"}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-11 border-[#23232D] text-[#F0F0F5] hover:bg-[#1E1E28] hover:text-[#F0F0F5] mb-6"
            >
              Contact Sales
            </Button>
            <ul className="space-y-3 flex-1">
              {teamFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#8A8A98]">
                  <Check className="size-4 text-[#22C55E] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-[#0F0F14] py-20 px-6">
        <div className="max-w-[960px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F0F0F5] text-center mb-12">
            Compare all features
          </h2>
          <div className="border border-[#23232D] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#16161D] border-b border-[#23232D] sticky top-0 z-10">
                    <th className="px-4 py-4 text-left text-xs font-medium text-[#8A8A98] uppercase tracking-wider w-1/2">
                      Feature
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-[#8A8A98] uppercase tracking-wider w-[120px]">
                      Free
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-[#6366F1] uppercase tracking-wider w-[120px] bg-[#6366F1]/5">
                      Pro
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-[#8A8A98] uppercase tracking-wider w-[120px]">
                      Team
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureCategories.map((cat) => (
                    <>
                      <tr
                        key={cat.name}
                        className="bg-[#1E1E28] border-b border-[#23232D]"
                      >
                        <td
                          colSpan={4}
                          className="px-4 py-2.5 text-xs font-semibold text-[#8A8A98] uppercase tracking-wider"
                        >
                          {cat.name}
                        </td>
                      </tr>
                      {cat.features.map((f, idx) => (
                        <tr
                          key={`${cat.name}-${f.name}`}
                          className={`border-b border-[#23232D] ${
                            idx % 2 === 0 ? "bg-transparent" : "bg-[#08080C]/50"
                          }`}
                        >
                          <FeatureRow
                            name={f.name}
                            free={f.free}
                            pro={f.pro}
                            team={f.team}
                          />
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F0F0F5] text-center mb-12">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="space-y-0">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-b border-[#23232D]"
              >
                <AccordionTrigger className="py-5 text-[#F0F0F5] text-base font-medium hover:no-underline hover:text-[#6366F1] transition-colors [&>svg]:text-[#5A5A68]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#8A8A98] leading-relaxed pb-5 max-w-[600px]">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative bg-[#0F0F14] border-t border-[#23232D] py-20 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F0F0F5] mb-4">
            Ready to accelerate your research?
          </h2>
          <p className="text-[#8A8A98] mb-8">
            Join thousands of researchers using ScholarMap to discover, track,
            and analyze academic papers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button className="h-11 bg-[#6366F1] hover:bg-[#818CF8] text-white px-6" onClick={handleProCheckout} disabled={checkout.isPending}>
              {checkout.isPending ? "Redirecting..." : "Start 14-Day Free Trial"}
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              className="h-11 border-[#23232D] text-[#F0F0F5] hover:bg-[#1E1E28] hover:text-[#F0F0F5] px-6"
            >
              Contact Sales
            </Button>
          </div>
          <p className="text-[11px] text-[#5A5A68] mt-4">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F0F14] border-t border-[#23232D] pt-16 pb-8 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="text-sm font-semibold text-[#F0F0F5] mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {["Features", "Pricing", "Changelog", "Roadmap"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-[#8A8A98] hover:text-[#F0F0F5] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F0F0F5] mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              {["Documentation", "API Reference", "Blog", "Community"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-[#8A8A98] hover:text-[#F0F0F5] transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F0F0F5] mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {["About", "Careers", "Contact", "Press"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-[#8A8A98] hover:text-[#F0F0F5] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F0F0F5] mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {["Privacy", "Terms", "Security", "Cookies"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-[#8A8A98] hover:text-[#F0F0F5] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-[#23232D]">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#6366F1]" />
            <span className="text-sm font-bold text-[#F0F0F5]">
              ScholarMap
            </span>
          </div>
          <p className="text-xs text-[#5A5A68]">
            &copy; 2025 ScholarMap. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
