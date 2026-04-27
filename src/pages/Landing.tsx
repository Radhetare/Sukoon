/**
 * Landing.tsx — Sukoon
 *
 * The marketing landing page at "/".
 * Note: App.tsx skips <Navbar> on this route because Landing
 * renders its own fixed nav (needed for the full-bleed hero effect).
 *
 * CSS variables (--sage, --teal, etc.) come from theme.css via index.css.
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// ─── Inline styles (injected once) ──────────────────────────────────────────
// ─── Inline styles (injected once) ──────────────────────────────────────────
import "./Landing.css";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: "🧠",
    name: "Emotion-Aware AI",
    desc: "Sukoon detects what you're feeling and responds with tailored empathy — not scripts.",
  },
  {
    icon: "🛡️",
    name: "Fully Anonymous",
    desc: "No account. No email. No phone. Your identity stays yours, always.",
  },
  {
    icon: "🌿",
    name: "CBT-Guided Support",
    desc: "Gentle cognitive techniques woven naturally into every conversation.",
  },
  {
    icon: "🆘",
    name: "Crisis Detection",
    desc: "If you're in distress, Sukoon recognises it and connects you to real help — instantly.",
  },
  {
    icon: "🫁",
    name: "Guided Breathing",
    desc: "One tap to a calming breathing exercise, right when you need it most.",
  },
  {
    icon: "📓",
    name: "Mood Journaling",
    desc: "Track how you feel over time. Your patterns tell a story worth understanding.",
  },
];

const steps = [
  {
    title: "Open Sukoon",
    desc: "No sign-up. No waiting room. Just open the app and you're there.",
  },
  {
    title: "Share how you feel",
    desc: "Type freely. Sukoon listens without judgment, without interruption.",
  },
  {
    title: "Receive gentle support",
    desc: "Get empathetic responses, coping tools, and breathing exercises tailored to you.",
  },
  {
    title: "Feel a little lighter",
    desc: "Each session leaves you with more clarity, calm, and self-compassion.",
  },
];

const whoCards = [
  {
    icon: "📚",
    label: "Students",
    sub: "Exam pressure, burnout, and the weight of everyone's expectations.",
  },
  {
    icon: "🏠",
    label: "Those at home",
    sub: "Navigating family tension, loneliness, and the quiet invisible struggles.",
  },
  {
    icon: "💼",
    label: "Young professionals",
    sub: "Imposter syndrome, workplace stress, and the pressure to always perform.",
  },
  {
    icon: "🌙",
    label: "Late-night thinkers",
    sub: "When your thoughts spiral at 2am and there's no one to call.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {


    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);

    observerRef.current = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.15 },
    );
    document
      .querySelectorAll(".lp-reveal, .lp-step, .lp-who-card, .lp-cta-card")
      .forEach((el) => observerRef.current!.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <>
      <div className="noise" />

      {/* ── Nav ── */}
      <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
        <a href="#" className="lp-nav-logo">
          Sukoon
        </a>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#who">For whom</a>
          <Link to="/chat" className="lp-btn-nav">
            Try Sukoon
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-blob lp-blob-1" />
          <div className="lp-blob lp-blob-2" />
          <div className="lp-blob lp-blob-3" />
          <svg
            className="lp-hero-line"
            style={{ top: "10%", right: "5%", width: 180, height: 180 }}
            viewBox="0 0 180 180"
            fill="none"
          >
            <circle cx="90" cy="90" r="88" strokeWidth="0.6" />
            <circle
              cx="90"
              cy="90"
              r="60"
              strokeWidth="0.4"
              strokeDasharray="4 6"
            />
          </svg>
          <svg
            className="lp-hero-line"
            style={{ bottom: "12%", left: "4%", width: 120, height: 120 }}
            viewBox="0 0 120 120"
            fill="none"
          >
            <path
              d="M10 60 Q60 10 110 60 Q60 110 10 60Z"
              strokeWidth="0.6"
              fill="none"
            />
          </svg>
        </div>

        <div className="lp-hero-inner">
          <span className="lp-hero-eyebrow">AI Emotional Support</span>
          <h1 className="lp-hero-title">
            Find your
            <br />
            <em>Sukoon</em>
          </h1>
          <p className="lp-hero-sub">
            A safe, non-judgmental space for youth to process emotions, find
            clarity, and feel understood — powered by empathetic AI.
          </p>
          <div className="lp-hero-cta">
            <Link to="/chat" className="lp-btn-primary">
              Start Talking →
            </Link>
            <a href="#features" className="lp-btn-ghost">
              See how it works
            </a>
          </div>
        </div>

        <div className="lp-hero-scroll">
          <div className="lp-scroll-line" />
          Scroll
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <p className="lp-section-label lp-reveal">What Sukoon offers</p>
        <h2 className="lp-section-title lp-reveal">
          Designed with care,
          <br />
          built for you
        </h2>
        <p className="lp-section-sub lp-reveal">
          Every feature exists to make you feel heard — not diagnosed, not
          judged, not rushed.
        </p>
        <div className="lp-features-grid">
          {features.map((f, i) => (
            <div
              className="lp-feature-card lp-reveal"
              key={f.name}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="lp-feature-icon">{f.icon}</div>
              <div className="lp-feature-name">{f.name}</div>
              <div className="lp-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="lp-section lp-how-section" id="how">
        <p className="lp-section-label lp-reveal">The Process</p>
        <h2 className="lp-section-title lp-reveal">Gentle, step by step</h2>
        <p className="lp-section-sub lp-reveal">
          No complex onboarding. Just open, breathe, and start.
        </p>
        <div className="lp-steps">
          {steps.map((s, i) => (
            <div
              className="lp-step"
              key={s.title}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <div className="lp-step-num">{i + 1}</div>
              <div>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quote ── */}
      <section className="lp-quote-section">
        <div className="lp-quote-blob lp-qb1" />
        <div className="lp-quote-blob lp-qb2" />
        <span className="lp-quote-mark">"</span>
        <blockquote>
          You don't have to be <em>okay</em> right now.
          <br />
          You just have to take one honest breath.
        </blockquote>
        <p className="lp-quote-author">The Sukoon Philosophy</p>
      </section>

      {/* ── Who It's For ── */}
      <section className="lp-section" id="who">
        <p className="lp-section-label lp-reveal">Who it's for</p>
        <h2 className="lp-section-title lp-reveal">
          Built for the quiet struggles
        </h2>
        <p className="lp-section-sub lp-reveal">
          Whether you're burning out before exams or carrying invisible weight —
          Sukoon is for you.
        </p>
        <div className="lp-who-grid">
          {whoCards.map((w) => (
            <div className="lp-who-card" key={w.label}>
              <div className="lp-who-icon">{w.icon}</div>
              <div className="lp-who-label">{w.label}</div>
              <div className="lp-who-sub">{w.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta-section">
        <div className="lp-cta-card">
          <h2 className="lp-cta-title">Ready to feel heard?</h2>
          <p className="lp-cta-sub">
            Sukoon is free, anonymous, and available right now.
            <br />
            No appointments. No waiting rooms. Just a conversation.
          </p>
          <Link to="/chat" className="lp-btn-primary">
            Open Sukoon →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <span className="lp-footer-logo">Sukoon</span>
        <span className="lp-footer-note">© 2025 · EN23CS · 6N-CSE</span>
        <div className="lp-footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </footer>
    </>
  );
}
