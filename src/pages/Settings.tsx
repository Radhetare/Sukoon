/**
 * Settings.tsx — Sukoon
 *
 * Settings page at /settings.
 * App preferences, data management, crisis resources, and about info.
 */

import { useState } from "react";
import "./Settings.css";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Toggle {
  id: string;
  label: string;
  sub: string;
  value: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Settings() {
  const [toggles, setToggles] = useState<Toggle[]>([
    {
      id: "sound",
      label: "Sound effects",
      sub: "Subtle sounds on send and receive",
      value: false,
    },
    {
      id: "timestamps",
      label: "Show timestamps",
      sub: "Display time on each message",
      value: true,
    },
    {
      id: "crisis",
      label: "Crisis detection",
      sub: "Automatically detect distress signals in your messages",
      value: true,
    },
    {
      id: "suggestions",
      label: "Conversation suggestions",
      sub: "Show helpful reply prompts after AI responses",
      value: true,
    },
    {
      id: "breathing",
      label: "Breathing reminders",
      sub: "Prompt breathing exercises during stressful conversations",
      value: false,
    },
  ]);

  const [cleared, setCleared] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const toggle = (id: string) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, value: !t.value } : t)),
    );
  };

  const clearData = () => {
    localStorage.removeItem("sukoon_journal_entries");
    setCleared(true);
    setShowClearConfirm(false);
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <div className="settings-page">
      <div className="settings-inner">
        <div className="settings-hero">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">
            Sukoon is designed around your comfort. Everything here is optional.
          </p>
        </div>

        {/* ── Preferences ── */}
        <section className="settings-section">
          <div className="settings-section-label">⚙️ Preferences</div>
          <div className="settings-card">
            {toggles.map((t, i) => (
              <div
                key={t.id}
                className={`settings-toggle-row${i < toggles.length - 1 ? " divider" : ""}`}
              >
                <div className="settings-toggle-text">
                  <div className="settings-toggle-label">{t.label}</div>
                  <div className="settings-toggle-sub">{t.sub}</div>
                </div>
                <button
                  className={`settings-toggle${t.value ? " on" : ""}`}
                  onClick={() => toggle(t.id)}
                  aria-label={`${t.label}: ${t.value ? "on" : "off"}`}
                  role="switch"
                  aria-checked={t.value}
                >
                  <div className="settings-toggle-thumb" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Privacy & Data ── */}
        <section className="settings-section">
          <div className="settings-section-label">🛡️ Privacy & Data</div>
          <div className="settings-card">
            <div className="settings-info-row divider">
              <div>
                <div className="settings-info-label">Anonymous session</div>
                <div className="settings-info-sub">
                  No account required. No data leaves your device.
                </div>
              </div>
              <div className="settings-badge">Active</div>
            </div>
            <div className="settings-info-row divider">
              <div>
                <div className="settings-info-label">Chat history</div>
                <div className="settings-info-sub">
                  Stored only in your current browser session. Closing the tab
                  clears it permanently.
                </div>
              </div>
              <div className="settings-badge private">Session only</div>
            </div>
            <div className="settings-info-row">
              <div>
                <div className="settings-info-label">Journal entries</div>
                <div className="settings-info-sub">
                  Stored locally in your browser. Never sent to any server.
                </div>
              </div>
              {!showClearConfirm ? (
                <button
                  className="settings-danger-btn"
                  onClick={() => setShowClearConfirm(true)}
                >
                  Clear all
                </button>
              ) : (
                <div className="settings-confirm-row">
                  <span className="settings-confirm-text">Are you sure?</span>
                  <button className="settings-danger-btn" onClick={clearData}>
                    Yes, clear
                  </button>
                  <button
                    className="settings-cancel-btn"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {cleared && (
              <div className="settings-cleared-msg">
                ✓ Journal entries cleared
              </div>
            )}
          </div>
        </section>

        {/* ── Crisis Resources ── */}
        <section className="settings-section">
          <div className="settings-section-label">🆘 Crisis Resources</div>
          <div className="settings-card settings-crisis-card">
            <p className="settings-crisis-note">
              If you&apos;re in distress, please reach out to a trained
              professional. You are not alone.
            </p>
            <div className="settings-crisis-list">
              {[
                { name: "iCall (India)", number: "9152987821", note: "Mon–Sat, 8am–10pm" },
                { name: "Vandrevala Foundation", number: "1860-2662-345", note: "24/7 helpline" },
                { name: "NIMHANS Helpline", number: "080-46110007", note: "Mental health support" },
              ].map((r) => (
                <div key={r.name} className="settings-crisis-item">
                  <div>
                    <div className="settings-crisis-name">{r.name}</div>
                    <div className="settings-crisis-note-text">{r.note}</div>
                  </div>
                  <a href={`tel:${r.number}`} className="settings-crisis-number">
                    {r.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="settings-section">
          <div className="settings-section-label">🌿 About Sukoon</div>
          <div className="settings-card settings-about-card">
            <div className="settings-about-logo">🌿 Sukoon</div>
            <p className="settings-about-text">
              Sukoon is a free, anonymous AI-powered emotional support companion
              built for youth. It is not a replacement for professional mental
              health care.
            </p>
            <div className="settings-about-meta">
              <span>Built by EN23CS · 6N-CSE</span>
              <span>·</span>
              <span>2025</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
