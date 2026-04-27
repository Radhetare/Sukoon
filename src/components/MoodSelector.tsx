/**
 * MoodSelector.tsx — Sukoon
 *
 * A beautiful, reusable mood selection component with two display modes:
 *  - "wheel"  : Circular orbital layout — immersive, full-screen check-in
 *  - "strip"  : Horizontal pill row    — compact, inline use inside Chat
 *
 * Props:
 *  - onSelect       : (mood: Mood) => void   — called when user picks a mood
 *  - selected?      : string                 — currently selected mood key
 *  - mode?          : "wheel" | "strip"      — display mode (default: "wheel")
 *  - showIntensity? : boolean                — show intensity slider (wheel only)
 *  - onClose?       : () => void             — close handler (wheel mode)
 *
 * Usage:
 *   // Full-screen check-in
 *   <MoodSelector mode="wheel" onSelect={handleMood} onClose={() => setOpen(false)} />
 *
 *   // Inline strip in Chat input area
 *   <MoodSelector mode="strip" onSelect={handleMood} selected={currentMood} />
 */

import { useState, useCallback } from "react";
import "./MoodSelector.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Mood {
  key: string;
  emoji: string;
  name: string;
  color: string; // accent color for this mood
  bgColor: string; // soft background tint
  description: string; // shown in wheel mode
  intensity?: number; // 1–5, set after selection
}

export interface MoodSelectorProps {
  onSelect: (mood: Mood) => void;
  selected?: string;
  mode?: "wheel" | "strip";
  showIntensity?: boolean;
  onClose?: () => void;
}

// ─── Mood Data ────────────────────────────────────────────────────────────────

export const MOODS: Mood[] = [
  {
    key: "anxious",
    emoji: "😰",
    name: "Anxious",
    color: "#e07b39",
    bgColor: "#fef3ec",
    description: "Racing thoughts, worry, unease",
  },
  {
    key: "sad",
    emoji: "😔",
    name: "Sad",
    color: "#5b8fcf",
    bgColor: "#eef4fb",
    description: "Heavy heart, low energy, grief",
  },
  {
    key: "stressed",
    emoji: "😤",
    name: "Stressed",
    color: "#c0392b",
    bgColor: "#fdf0ef",
    description: "Overwhelmed, pressure, tension",
  },
  {
    key: "numb",
    emoji: "😶",
    name: "Numb",
    color: "#7f8c8d",
    bgColor: "#f2f4f4",
    description: "Disconnected, empty, flat",
  },
  {
    key: "lonely",
    emoji: "🥺",
    name: "Lonely",
    color: "#8e44ad",
    bgColor: "#f5eefb",
    description: "Isolated, longing, unseen",
  },
  {
    key: "angry",
    emoji: "😠",
    name: "Angry",
    color: "#e74c3c",
    bgColor: "#fdecea",
    description: "Frustrated, irritated, tense",
  },
  {
    key: "calm",
    emoji: "🌿",
    name: "Calm",
    color: "#3d8b7a",
    bgColor: "#e8f2ee",
    description: "Peaceful, grounded, settled",
  },
  {
    key: "okay",
    emoji: "😊",
    name: "Okay",
    color: "#7aab95",
    bgColor: "#eef7f3",
    description: "Neutral, stable, getting by",
  },
  {
    key: "hopeful",
    emoji: "🌱",
    name: "Hopeful",
    color: "#27ae60",
    bgColor: "#eafaf1",
    description: "Optimistic, expectant, light",
  },
];

const INTENSITY_LABELS = ["Barely", "Slightly", "Moderately", "Quite", "Very"];

// ─── CSS ──────────────────────────────────────────────────────────────────────
// Styles extracted to MoodSelector.css

// ─── Strip Mode ───────────────────────────────────────────────────────────────

const StripMode = ({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (mood: Mood) => void;
}) => (
  <div className="ms-strip">
    {MOODS.map((mood) => {
      const isSelected = selected === mood.key;
      return (
        <button
          key={mood.key}
          className={`ms-strip-pill ${isSelected ? "ms-strip-selected" : ""}`}
          style={
            isSelected
              ? { background: mood.color, borderColor: mood.color }
              : {}
          }
          onClick={() => onSelect(mood)}
          title={mood.description}
          aria-pressed={isSelected}
        >
          <span>{mood.emoji}</span>
          <span>{mood.name}</span>
        </button>
      );
    })}
  </div>
);

// ─── Wheel Mode ───────────────────────────────────────────────────────────────

const WheelMode = ({
  selected,
  onSelect,
  onClose,
  showIntensity,
}: {
  selected?: string;
  onSelect: (mood: Mood) => void;
  onClose?: () => void;
  showIntensity: boolean;
}) => {
  const [localSelected, setLocalSelected] = useState<Mood | null>(
    MOODS.find((m) => m.key === selected) ?? null,
  );
  const [intensity, setIntensity] = useState(3);

  const handleCardClick = useCallback((mood: Mood) => {
    setLocalSelected((prev) => (prev?.key === mood.key ? null : mood));
    setIntensity(3);
  }, []);

  const handleConfirm = () => {
    if (!localSelected) return;
    onSelect({ ...localSelected, intensity });
    onClose?.();
  };

  return (
    <div className="ms-overlay" onClick={onClose}>
      <div className="ms-wheel-card" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        {onClose && (
          <button className="ms-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}

        {/* Header */}
        <div className="ms-wheel-header">
          <div className="ms-wheel-eyebrow">Daily Check-in</div>
          <h2 className="ms-wheel-title">
            How are you <em>feeling</em>?
          </h2>
          <p className="ms-wheel-sub">
            No right or wrong answer. Just an honest moment with yourself.
          </p>
        </div>

        {/* Mood grid */}
        <div className="ms-grid">
          {MOODS.map((mood) => {
            const isSelected = localSelected?.key === mood.key;
            return (
              <div
                key={mood.key}
                className={`ms-mood-card ${isSelected ? "ms-selected" : ""}`}
                style={
                  isSelected
                    ? {
                        background: mood.bgColor,
                        borderColor: mood.color,
                        boxShadow: `0 8px 28px ${mood.color}25`,
                      }
                    : { borderColor: "rgba(122,171,149,0.12)" }
                }
                onClick={() => handleCardClick(mood)}
                role="button"
                aria-pressed={isSelected}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleCardClick(mood)}
              >
                {/* Tinted bg */}
                <div
                  className="ms-mood-card-bg"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: mood.bgColor,
                    opacity: 0,
                    transition: "opacity 0.2s",
                    borderRadius: "inherit",
                  }}
                />
                {/* Checkmark */}
                <div className="ms-check" style={{ background: mood.color }}>
                  ✓
                </div>
                <span className="ms-mood-emoji">{mood.emoji}</span>
                <div
                  className="ms-mood-name"
                  style={isSelected ? { color: mood.color } : {}}
                >
                  {mood.name}
                </div>
                <div className="ms-mood-desc">{mood.description}</div>
              </div>
            );
          })}
        </div>

        {/* Intensity slider */}
        {showIntensity && localSelected && (
          <div className="ms-intensity">
            <div className="ms-intensity-header">
              <span className="ms-intensity-label">
                How intense is this feeling?
              </span>
              <span
                className="ms-intensity-value"
                style={{ color: localSelected.color }}
              >
                {INTENSITY_LABELS[intensity - 1]}
              </span>
            </div>
            <div className="ms-intensity-dots">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`ms-dot-btn ${intensity >= n ? "ms-dot-active" : ""}`}
                  style={
                    intensity >= n ? { background: localSelected.color } : {}
                  }
                  onClick={() => setIntensity(n)}
                  aria-label={`Intensity ${n}`}
                />
              ))}
            </div>
            <div className="ms-intensity-text">
              {INTENSITY_LABELS[intensity - 1]}{" "}
              {localSelected.name.toLowerCase()}
            </div>
          </div>
        )}

        {/* Confirm */}
        <button
          className="ms-confirm"
          disabled={!localSelected}
          onClick={handleConfirm}
          style={
            localSelected
              ? {
                  background: `linear-gradient(135deg, ${localSelected.color}, ${localSelected.color}cc)`,
                }
              : { background: "var(--ms-sage-light)" }
          }
        >
          {localSelected
            ? `I'm feeling ${localSelected.name} ${localSelected.emoji}`
            : "Select how you're feeling"}
        </button>

        <p className="ms-confirm-hint">
          Your mood helps Sukoon respond with more care 🌿
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MoodSelector({
  onSelect,
  selected,
  mode = "wheel",
  showIntensity = true,
  onClose,
}: MoodSelectorProps) {


  if (mode === "strip") {
    return <StripMode selected={selected} onSelect={onSelect} />;
  }

  return (
    <WheelMode
      selected={selected}
      onSelect={onSelect}
      onClose={onClose}
      showIntensity={showIntensity}
    />
  );
}
