/**
 * Journal.tsx — Sukoon
 *
 * Mood journal page at /journal.
 * Users can write entries tagged with a mood, view past entries,
 * and reflect on patterns over time. Data is stored in localStorage.
 */

import { useState, useEffect, useRef } from "react";
import "./Journal.css";

// ─── Types ─────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: number;
  text: string;
  mood: string;
  moodEmoji: string;
  date: string;
  timestamp: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MOODS = [
  { key: "calm", emoji: "🌿", name: "Calm", color: "#4caf7d" },
  { key: "happy", emoji: "😊", name: "Happy", color: "#f5a623" },
  { key: "anxious", emoji: "😰", name: "Anxious", color: "#9b59b6" },
  { key: "sad", emoji: "💙", name: "Sad", color: "#3d7ab5" },
  { key: "stressed", emoji: "⚡", name: "Stressed", color: "#e67e22" },
  { key: "frustrated", emoji: "🔥", name: "Frustrated", color: "#e74c3c" },
];

const PROMPTS = [
  "What's on your mind today?",
  "What made you feel something today?",
  "What are you grateful for right now?",
  "What's one thing you want to let go of?",
  "How does your body feel right now?",
  "What would you tell your younger self today?",
];

const STORAGE_KEY = "sukoon_journal_entries";

const loadEntries = (): JournalEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveEntries = (entries: JournalEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── Component ──────────────────────────────────────────────────────────────

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>(loadEntries);
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState<(typeof MOODS)[0] | null>(null);
  const [prompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [saved, setSaved] = useState(false);
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [text]);

  const handleSave = () => {
    if (!text.trim()) return;
    const mood = selectedMood ?? MOODS[0];
    const newEntry: JournalEntry = {
      id: Date.now(),
      text: text.trim(),
      mood: mood.name,
      moodEmoji: mood.emoji,
      date: formatDate(Date.now()),
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setText("");
    setSelectedMood(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = (id: number) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  const filtered = filterMood
    ? entries.filter((e) => e.mood.toLowerCase() === filterMood)
    : entries;

  const moodCounts = MOODS.reduce(
    (acc, m) => {
      acc[m.name] = entries.filter((e) => e.mood === m.name).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="journal-page">
      {/* ── Sidebar ── */}
      <aside className="journal-sidebar">
        <div className="journal-sidebar-header">
          <div className="journal-sidebar-title">📓 Journal</div>
          <div className="journal-sidebar-sub">Your private reflection space</div>
        </div>

        {/* Mood filter */}
        <div className="journal-filter-section">
          <div className="journal-filter-label">Filter by mood</div>
          <div className="journal-filter-list">
            <button
              className={`journal-filter-btn${!filterMood ? " active" : ""}`}
              onClick={() => setFilterMood(null)}
            >
              All entries
              <span className="journal-filter-count">{entries.length}</span>
            </button>
            {MOODS.filter((m) => moodCounts[m.name] > 0).map((m) => (
              <button
                key={m.key}
                className={`journal-filter-btn${filterMood === m.name.toLowerCase() ? " active" : ""}`}
                onClick={() =>
                  setFilterMood(
                    filterMood === m.name.toLowerCase() ? null : m.name.toLowerCase(),
                  )
                }
              >
                <span>{m.emoji}</span> {m.name}
                <span className="journal-filter-count">{moodCounts[m.name]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Entry list */}
        <div className="journal-entry-list">
          {filtered.length === 0 ? (
            <div className="journal-empty-list">No entries yet</div>
          ) : (
            filtered.map((entry) => (
              <button
                key={entry.id}
                className={`journal-entry-item${selectedEntry?.id === entry.id ? " active" : ""}`}
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="journal-entry-mood">
                  {entry.moodEmoji}{" "}
                  <span className="journal-entry-date">{entry.date}</span>
                </div>
                <div className="journal-entry-preview">
                  {entry.text.slice(0, 80)}
                  {entry.text.length > 80 ? "…" : ""}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main Area ── */}
      <main className="journal-main">
        {selectedEntry ? (
          /* ── View Entry ── */
          <div className="journal-view">
            <div className="journal-view-header">
              <button
                className="journal-back-btn"
                onClick={() => setSelectedEntry(null)}
              >
                ← New Entry
              </button>
              <button
                className="journal-delete-btn"
                onClick={() => handleDelete(selectedEntry.id)}
                title="Delete entry"
              >
                🗑 Delete
              </button>
            </div>
            <div className="journal-view-meta">
              <span className="journal-view-mood">
                {selectedEntry.moodEmoji} {selectedEntry.mood}
              </span>
              <span className="journal-view-time">
                {selectedEntry.date} · {formatTime(selectedEntry.timestamp)}
              </span>
            </div>
            <div className="journal-view-text">{selectedEntry.text}</div>
          </div>
        ) : (
          /* ── Write Entry ── */
          <div className="journal-write">
            <div className="journal-write-header">
              <div className="journal-write-title">New Entry</div>
              <div className="journal-write-date">{formatDate(Date.now())}</div>
            </div>

            {/* Mood picker */}
            <div className="journal-mood-section">
              <div className="journal-mood-label">How are you feeling?</div>
              <div className="journal-mood-row">
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    className={`journal-mood-btn${selectedMood?.key === m.key ? " active" : ""}`}
                    onClick={() =>
                      setSelectedMood(selectedMood?.key === m.key ? null : m)
                    }
                    title={m.name}
                    style={
                      selectedMood?.key === m.key
                        ? { borderColor: m.color, background: `${m.color}18` }
                        : {}
                    }
                  >
                    <span className="journal-mood-emoji">{m.emoji}</span>
                    <span className="journal-mood-name">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div className="journal-prompt">
              <span className="journal-prompt-icon">✦</span> {prompt}
            </div>

            {/* Textarea */}
            <div className="journal-textarea-wrap">
              <textarea
                ref={textareaRef}
                className="journal-textarea"
                placeholder="Write freely — this is your space. No one is watching."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
              />
              <div className="journal-char-count">
                {text.length > 0 && `${text.length} characters`}
              </div>
            </div>

            <div className="journal-actions">
              <button
                className={`journal-save-btn${saved ? " saved" : ""}`}
                onClick={handleSave}
                disabled={!text.trim()}
              >
                {saved ? "✓ Saved" : "Save Entry"}
              </button>
              {text.length > 0 && (
                <button className="journal-clear-btn" onClick={() => setText("")}>
                  Clear
                </button>
              )}
            </div>

            {entries.length === 0 && (
              <div className="journal-onboarding">
                <div className="journal-onboarding-icon">📓</div>
                <div className="journal-onboarding-text">
                  Your journal is private, stored only on this device. Write as
                  much or as little as you'd like — there's no pressure here.
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
