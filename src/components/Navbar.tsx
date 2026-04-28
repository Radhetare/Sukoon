/**
 * Navbar.tsx — Sukoon
 *
 * A fully responsive, polished navigation bar with:
 *  - Transparent → frosted glass on scroll
 *  - Active route highlighting
 *  - Mobile hamburger menu with animated drawer
 *  - Daily mood quick-access button
 *  - Notification badge support
 *  - Smooth entry animation
 *
 * Props:
 *  - currentPath?      : string            — active route (e.g. "/chat")
 *  - onNavigate?       : (path: string)    — called on nav link click
 *  - onMoodClick?      : () => void        — opens MoodSelector
 *  - currentMood?      : { emoji, name }   — shows active mood in nav
 *  - notifCount?       : number            — notification badge count
 *  - variant?          : "light" | "dark"  — forced color scheme (default: auto)
 *
 * Usage:
 *   <Navbar
 *     currentPath="/chat"
 *     onNavigate={(path) => navigate(path)}
 *     onMoodClick={() => setMoodOpen(true)}
 *     currentMood={{ emoji: "🌿", name: "Calm" }}
 *   />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import "./Navbar.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavbarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onMoodClick?: () => void;
  currentMood?: { emoji: string; name: string };
  notifCount?: number;
  variant?: "light" | "dark" | "auto";
}

interface NavLink {
  label: string;
  path: string;
  icon: string;
}

// ─── Nav Links ────────────────────────────────────────────────────────────────

const NAV_LINKS: NavLink[] = [
  { label: "Home", path: "/", icon: "🏠" },
  { label: "Chat", path: "/chat", icon: "💬" },
  { label: "Journal", path: "/journal", icon: "📓" },
  { label: "Privacy", path: "/privacy", icon: "🛡️" },
  { label: "Settings", path: "/settings", icon: "⚙️" },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
// Styles extracted to Navbar.css

// ─── Component ────────────────────────────────────────────────────────────────

export default function Navbar({
  currentPath = "/",
  onNavigate,
  onMoodClick,
  currentMood,
  notifCount = 0,
  variant = "auto",
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);



  // ── Scroll listener ──────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      // Reading progress
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const total = doc.scrollHeight - doc.clientHeight;
      setScrollProgress(total > 0 ? (scrollTop / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Close drawer on outside click ───────────────────
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  // ── Close drawer on route change ────────────────────
  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  // ── Navigate ─────────────────────────────────────────
  const navigate = useCallback(
    (path: string) => {
      onNavigate?.(path);
      setMobileOpen(false);
    },
    [onNavigate],
  );

  // ── Compute classes ──────────────────────────────────
  const isDark = variant === "dark";
  const navClass = [
    "nb-nav",
    scrolled ? "nb-scrolled" : "nb-top",
    isDark ? "nb-dark" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const isActive = (path: string) => currentPath === path;

  return (
    <>
      {/* Skip to content */}
      <a href="#main-content" className="nb-skip">
        Skip to content
      </a>

      <nav className={navClass} role="navigation" aria-label="Main navigation">
        {/* Reading progress bar */}
        <div
          className={`nb-progress ${scrollProgress > 1 ? "nb-visible" : ""}`}
          style={{ width: `${scrollProgress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(scrollProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />

        {/* ── Logo ── */}
        <button
          className="nb-logo"
          onClick={() => navigate("/")}
          aria-label="Sukoon home"
        >
          <div className="nb-logo-icon">🌿</div>
          <span className="nb-logo-text">Sukoon</span>
        </button>

        {/* ── Desktop Links ── */}
        <ul className="nb-links" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.path}>
              <button
                className={`nb-link ${isActive(link.path) ? "nb-active" : ""}`}
                onClick={() => navigate(link.path)}
                aria-current={isActive(link.path) ? "page" : undefined}
              >
                <span className="nb-link-icon">{link.icon}</span>
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* ── Right section ── */}
        <div className="nb-right">
          {/* Mood button */}
          {onMoodClick && (
            <button
              className={`nb-mood-btn ${currentMood ? "nb-mood-active" : ""}`}
              onClick={onMoodClick}
              aria-label={
                currentMood ? `Mood: ${currentMood.name}` : "Set your mood"
              }
              title="Set your mood"
            >
              <span className="nb-mood-emoji">
                {currentMood ? currentMood.emoji : "🌿"}
              </span>
              <span>{currentMood ? currentMood.name : "How are you?"}</span>
            </button>
          )}

          {/* Notification bell */}
          <button
            className="nb-notif-btn"
            aria-label={`Notifications${notifCount > 0 ? ` (${notifCount})` : ""}`}
            title="Notifications"
          >
            🔔
            {notifCount > 0 && (
              <span className="nb-badge" aria-hidden="true">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>

          {/* CTA */}
          <button
            className="nb-cta"
            onClick={() => navigate("/chat")}
            aria-label="Open Sukoon chat"
          >
            Open Sukoon →
          </button>

          {/* Hamburger */}
          <button
            className={`nb-burger ${mobileOpen ? "nb-open" : ""}`}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="nb-mobile-drawer"
          >
            <span className="nb-burger-line" />
            <span className="nb-burger-line" />
            <span className="nb-burger-line" />
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <div
        id="nb-mobile-drawer"
        ref={drawerRef}
        className={`nb-drawer ${mobileOpen ? "nb-drawer-open" : ""}`}
        aria-hidden={!mobileOpen}
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Mood row in drawer */}
        {onMoodClick && (
          <div
            className="nb-drawer-mood"
            onClick={() => {
              onMoodClick();
              setMobileOpen(false);
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>
              {currentMood ? currentMood.emoji : "🌿"}
            </span>
            <div>
              <div className="nb-drawer-mood-text">
                {currentMood
                  ? `Feeling ${currentMood.name}`
                  : "How are you feeling?"}
              </div>
              <div className="nb-drawer-mood-sub">Tap to update your mood</div>
            </div>
          </div>
        )}

        {/* Links */}
        <nav className="nb-drawer-links" aria-label="Mobile navigation">
          {NAV_LINKS.map((link, i) => (
            <button
              key={link.path}
              className={`nb-drawer-link ${isActive(link.path) ? "nb-active" : ""}`}
              onClick={() => navigate(link.path)}
              aria-current={isActive(link.path) ? "page" : undefined}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="nb-drawer-icon">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>

        <div className="nb-drawer-divider" />

        {/* CTA */}
        <button className="nb-drawer-cta" onClick={() => navigate("/chat")}>
          💬 Start Talking to Sukoon
        </button>
      </div>
    </>
  );
}
