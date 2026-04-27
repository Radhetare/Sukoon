/**
 * Chat.tsx — Sukoon
 *
 * The /chat page. Composes the sidebar + ChatWindow.
 * All message rendering is delegated to ChatWindow.tsx.
 * All AI calls go through services/api.ts.
 */

import { useState, useCallback } from "react";
import ChatWindow, { type Message } from "../components/ChatWindow";
import { sendMessage, type ChatMessage } from "../services/api";
import "./Chat.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Mood {
  key: string;
  emoji: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOODS: Mood[] = [
  { key: "calm", emoji: "🌿", name: "Calm" },
  { key: "anxious", emoji: "😰", name: "Anxious" },
  { key: "sad", emoji: "💙", name: "Sad" },
  { key: "stressed", emoji: "⚡", name: "Stressed" },
  { key: "angry", emoji: "🔥", name: "Frustrated" },
  { key: "happy", emoji: "😊", name: "Happy" },
];

const PAST_SESSIONS = [
  { title: "Feeling overwhelmed at work", time: "Yesterday" },
  { title: "Exam anxiety", time: "2 days ago" },
  { title: "Family conflict", time: "Last week" },
];

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── CSS ──────────────────────────────────────────────────────────────────────
// Styles extracted to Chat.css

// ─── Breathing phases ─────────────────────────────────────────────────────────

const BREATH_PHASES = ["Breathe in 🌬️", "Hold 🫁", "Breathe out 💨", "Hold 🫁"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showMoodBanner, setShowMoodBanner] = useState(false);
  const [activeMood, setActiveMood] = useState<Mood | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);



  // ── Breathing timer ──────────────────────────────────
  const startBreathing = () => {
    setShowBreathing(true);
    setBreathPhaseIdx(0);
    const interval = setInterval(() => {
      setBreathPhaseIdx((i) => {
        if (i >= BREATH_PHASES.length - 1) {
          clearInterval(interval);
          return i;
        }
        return i + 1;
      });
    }, 4000);
  };

  // ── Mood selection ───────────────────────────────────
  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood.key);
    setActiveMood(mood);
    setShowMoodBanner(true);
  };

  // ── Send message ─────────────────────────────────────
  const handleSend = useCallback(
    async (text: string) => {
      // Add user message
      const userMsg: Message = {
        id: Date.now(),
        role: "user",
        text,
        time: getTime(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      // Build history for API
      const newHistory: ChatMessage[] = [
        ...chatHistory,
        { role: "user", content: text },
      ];
      setChatHistory(newHistory);

      try {
        const response = await sendMessage(newHistory, {
          mood: selectedMood ?? undefined,
          sessionId,
        });

        if (!sessionId) setSessionId(response.sessionId);

        const aiMsg: Message = {
          id: Date.now() + 1,
          role: "ai",
          text: response.text,
          time: getTime(),
          emotion: response.emotion?.tag,
          suggestions: response.isCrisis
            ? undefined
            : ["Tell me more", "I need a moment", "What should I do?"],
        };

        setMessages((prev) => [...prev, aiMsg]);
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: response.text },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "ai",
            text: "I'm having trouble connecting right now. Please try again in a moment.",
            time: getTime(),
            isError: true,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [chatHistory, selectedMood, sessionId],
  );

  return (
    <>
      {/* Breathing overlay */}
      {showBreathing && (
        <div className="chat-overlay" onClick={() => setShowBreathing(false)}>
          <div
            className="chat-breathing-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="chat-breathing-title">Guided Breathing</h2>
            <p className="chat-breathing-sub">
              Follow the circle. Let your breath guide you.
            </p>
            <div className="chat-breathing-circle">
              {BREATH_PHASES[breathPhaseIdx].split(" ")[0]}
            </div>
            <p className="chat-breathing-phase">
              {BREATH_PHASES[breathPhaseIdx]}
            </p>
            <button
              className="chat-breathing-close"
              onClick={() => setShowBreathing(false)}
            >
              I feel better now
            </button>
          </div>
        </div>
      )}

      <div className="chat-page">
        {/* ── Sidebar ── */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-logo">
              <span>🌿</span> Sukoon
            </div>
            <div className="chat-sidebar-tagline">Your safe space, always</div>
          </div>

          <p className="chat-sidebar-label">How are you feeling?</p>
          <div className="chat-mood-list">
            {MOODS.map((m) => (
              <button
                key={m.key}
                className={`chat-mood-item${selectedMood === m.key ? " active" : ""}`}
                onClick={() => handleMoodSelect(m)}
              >
                <span className="chat-mood-emoji">{m.emoji}</span>
                <span className="chat-mood-name">{m.name}</span>
              </button>
            ))}
          </div>

          <div className="chat-sidebar-divider" />

          <p className="chat-sidebar-label">Past Sessions</p>
          <div className="chat-session-list">
            {PAST_SESSIONS.map((s, i) => (
              <button
                key={i}
                className={`chat-session-item${i === 0 ? " active" : ""}`}
              >
                <div className="chat-session-title">💬 {s.title}</div>
                <div className="chat-session-time">{s.time}</div>
              </button>
            ))}
          </div>

          <div className="chat-sidebar-footer">
            <div className="chat-sidebar-avatar">Y</div>
            <div>
              <div className="chat-sidebar-name">You</div>
              <span className="chat-sidebar-badge">Anonymous</span>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="chat-main">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-ai-avatar">🌿</div>
              <div>
                <div className="chat-header-name">Sukoon AI</div>
                <div className="chat-header-status">Online · Here for you</div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                className="chat-icon-btn"
                title="Breathing exercise"
                onClick={startBreathing}
              >
                🫁
              </button>
              <button className="chat-icon-btn" title="Journal">
                📓
              </button>
              <button className="chat-icon-btn" title="Settings">
                ⚙️
              </button>
            </div>
          </div>

          {/* Mood banner */}
          {showMoodBanner && activeMood && (
            <div className="chat-mood-banner">
              <span style={{ fontSize: "1.2rem" }}>{activeMood.emoji}</span>
              <div>
                <div className="chat-mood-banner-text">
                  Mood: {activeMood.name}
                </div>
                <div className="chat-mood-banner-sub">
                  Sukoon will tailor its responses to support you
                </div>
              </div>
              <button
                className="chat-mood-banner-close"
                onClick={() => setShowMoodBanner(false)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat window — all message rendering happens inside here */}
          <ChatWindow
            messages={messages}
            isTyping={isTyping}
            onSend={handleSend}
            onChipClick={handleSend}
          />
        </main>
      </div>
    </>
  );
}
