import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ─── tiny hook: detect if element is visible in viewport ─── */
function useVisible(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─── data ─── */
const NAV_LINKS = ["Features", "Stats", "Testimonials", "Contact"];

const FEATURES = [
  {
    icon: "🤖",
    title: "AI-Powered Insights",
    desc: "Get real-time sentiment analysis and smart lead scoring powered by large language models.",
  },
  {
    icon: "⚡",
    title: "Instant Automation",
    desc: "Auto-fill customer records, schedule follow-ups, and trigger workflows without lifting a finger.",
  },
  {
    icon: "📊",
    title: "Live Analytics",
    desc: "Visualise your pipeline, conversion rates, and team performance in one beautiful dashboard.",
  },
  {
    icon: "🔒",
    title: "Enterprise Security",
    desc: "End-to-end encryption, role-based access control, and SOC-2 compliant data storage.",
  },
  {
    icon: "🌐",
    title: "Omni-Channel CRM",
    desc: "Manage email, chat, phone, and social interactions from a single unified inbox.",
  },
  {
    icon: "🔗",
    title: "Seamless Integrations",
    desc: "Connect with Slack, Zapier, Stripe, HubSpot and 200+ apps out of the box.",
  },
];

const STATS = [
  { value: "98%", label: "Customer Satisfaction" },
  { value: "3×", label: "Faster Lead Conversion" },
  { value: "50k+", label: "Active Users" },
  { value: "4.9★", label: "Average Rating" },
];

const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    role: "VP of Sales, Nexora",
    avatar: "SM",
    quote:
      "This CRM completely transformed how we handle leads. The AI suggestions alone save our team 4 hours every day.",
  },
  {
    name: "James Okafor",
    role: "Founder, GridScale",
    avatar: "JO",
    quote:
      "Clean UI, blazing fast, and the sentiment analysis is eerily accurate. We doubled our close rate in 60 days.",
  },
  {
    name: "Priya Sharma",
    role: "Customer Success Lead, Veloxa",
    avatar: "PS",
    quote:
      "Finally a CRM that feels like it was designed for humans. Onboarding took 20 minutes and the whole team loved it.",
  },
];

/* ─── sub-components ─── */
function FeatureCard({ icon, title, desc, delay }) {
  const [ref, visible] = useVisible();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
      className="lp-feature-card"
    >
      <span className="lp-feature-icon">{icon}</span>
      <h3 className="lp-feature-title">{title}</h3>
      <p className="lp-feature-desc">{desc}</p>
    </div>
  );
}

function StatItem({ value, label, delay }) {
  const [ref, visible] = useVisible();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.8)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
      className="lp-stat-item"
    >
      <span className="lp-stat-value">{value}</span>
      <span className="lp-stat-label">{label}</span>
    </div>
  );
}

function TestimonialCard({ name, role, avatar, quote, delay }) {
  const [ref, visible] = useVisible();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
      className="lp-testimonial-card"
    >
      <p className="lp-testimonial-quote">"{quote}"</p>
      <div className="lp-testimonial-author">
        <div className="lp-testimonial-avatar">{avatar}</div>
        <div>
          <div className="lp-testimonial-name">{name}</div>
          <div className="lp-testimonial-role">{role}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── main component ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  /* sticky header shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* active nav highlight */
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.toLowerCase()));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { threshold: 0.4 }
    );
    sections.forEach((s) => s && obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) { setSubmitted(true); setEmail(""); }
  };

  return (
    <div className="lp-root">
      {/* animated orbs */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />

      {/* ═══ HEADER ═══ */}
      <header className={`lp-header ${scrolled ? "lp-header-scrolled" : ""}`}>
        <div className="lp-header-inner">
          {/* logo */}
          <a href="#" className="lp-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <span className="lp-logo-icon">⚡</span>
            <span className="lp-logo-text">Nexus<span className="lp-logo-accent">CRM</span></span>
          </a>

          {/* desktop nav */}
          <nav className="lp-nav">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link.toLowerCase())}
                className={`lp-nav-link ${activeSection === link.toLowerCase() ? "lp-nav-link-active" : ""}`}
              >
                {link}
              </button>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="lp-header-ctas">
            <button className="lp-btn-primary" onClick={() => navigate("/dashboard")}>Get Started Free</button>
          </div>

          {/* mobile hamburger */}
          <button className="lp-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <span className={`lp-ham-line ${mobileOpen ? "lp-ham-open" : ""}`} />
            <span className={`lp-ham-line lp-ham-mid ${mobileOpen ? "lp-ham-open" : ""}`} />
            <span className={`lp-ham-line ${mobileOpen ? "lp-ham-open" : ""}`} />
          </button>
        </div>

        {/* mobile menu */}
        <div className={`lp-mobile-menu ${mobileOpen ? "lp-mobile-open" : ""}`}>
          {NAV_LINKS.map((link) => (
            <button key={link} onClick={() => scrollTo(link.toLowerCase())} className="lp-mobile-link">{link}</button>
          ))}
          <button className="lp-btn-primary lp-mobile-cta" onClick={() => navigate("/dashboard")}>Get Started Free</button>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="lp-hero">
        <div className="lp-hero-badge">✨ AI-First CRM Platform</div>
        <h1 className="lp-hero-title">
          Transform Customer<br />
          <span className="lp-hero-gradient">Relationships with AI</span>
        </h1>
        <p className="lp-hero-sub">
          Automate workflows, surface deep insights, and close deals faster with an intelligent CRM that works as hard as you do.
        </p>
        <div className="lp-hero-actions">
          <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate("/dashboard")}>
            Enter Dashboard →
          </button>
          <button className="lp-btn-ghost lp-btn-lg" onClick={() => scrollTo("features")}>
            See Features
          </button>
        </div>
        <div className="lp-hero-trust">
          <span className="lp-trust-text">Trusted by teams at</span>
          {["Nexora", "GridScale", "Veloxa", "Synapse", "Orbit"].map((b) => (
            <span key={b} className="lp-trust-brand">{b}</span>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="lp-section">
        <div className="lp-section-tag">Features</div>
        <h2 className="lp-section-title">Everything you need to close more deals</h2>
        <p className="lp-section-sub">One platform to manage every stage of your customer journey.</p>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section id="stats" className="lp-stats-section">
        <div className="lp-stats-inner">
          <div className="lp-section-tag">Numbers</div>
          <h2 className="lp-section-title" style={{ color: "#fff", marginBottom: 48 }}>
            Results that speak for themselves
          </h2>
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <StatItem key={s.label} {...s} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="lp-section">
        <div className="lp-section-tag">Testimonials</div>
        <h2 className="lp-section-title">Loved by thousands of teams</h2>
        <div className="lp-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} {...t} delay={i * 120} />
          ))}
        </div>
      </section>

      {/* ═══ CONTACT / CTA ═══ */}
      <section id="contact" className="lp-cta-section">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Ready to transform your sales?</h2>
          <p className="lp-cta-sub">Join 50,000+ teams. No credit card required.</p>
          {submitted ? (
            <div className="lp-cta-success">🎉 You're on the list! We'll be in touch soon.</div>
          ) : (
            <form className="lp-cta-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lp-cta-input"
                required
              />
              <button type="submit" className="lp-btn-primary lp-btn-lg">Get Early Access</button>
            </form>
          )}
          <button className="lp-cta-dash-link" onClick={() => navigate("/dashboard")}>
            Or jump straight to the dashboard →
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <span className="lp-logo-icon">⚡</span>
              <span className="lp-logo-text">Nexus<span className="lp-logo-accent">CRM</span></span>
            </div>
            <p className="lp-footer-brand-desc">
              AI-powered CRM for modern sales teams. Close more, stress less.
            </p>
          </div>

          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Product</div>
              {["Features", "Pricing", "Changelog", "Roadmap"].map((l) => (
                <a key={l} href="#" className="lp-footer-link">{l}</a>
              ))}
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Company</div>
              {["About", "Blog", "Careers", "Press"].map((l) => (
                <a key={l} href="#" className="lp-footer-link">{l}</a>
              ))}
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Support</div>
              {["Documentation", "API Reference", "Status", "Contact"].map((l) => (
                <a key={l} href="#" className="lp-footer-link">{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} NexusCRM. All rights reserved.</span>
          <div className="lp-footer-legal">
            <a href="#" className="lp-footer-link-sm">Privacy Policy</a>
            <a href="#" className="lp-footer-link-sm">Terms of Service</a>
            <a href="#" className="lp-footer-link-sm">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
