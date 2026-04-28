/**
 * Signup.tsx — Sukoon
 * Creates a new account, logs the user in immediately, redirects to /chat.
 */

import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup, login } from "../services/api";
import "./Auth.css";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (password !== confirm) {
        setError("Passwords don't match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      setLoading(true);
      try {
        await signup(email, password);
        // Auto-login after registration
        try {
          await login(email, password);
          navigate("/chat");
        } catch {
          navigate("/login");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, confirm, navigate],
  );

  const strength =
    password.length === 0
      ? 0
      : password.length < 8
      ? 1
      : password.length < 12 || !/[^a-zA-Z0-9]/.test(password)
      ? 2
      : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];
  const strengthClass = ["", "auth-strength-weak", "auth-strength-fair", "auth-strength-strong"][strength];

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-panel-logo">🌿 Sukoon</div>
          <p className="auth-panel-tagline">
            A quiet space, just for you.
          </p>
          <div className="auth-panel-leaves" aria-hidden="true">
            <span>🌿</span>
            <span>🍃</span>
            <span>🌱</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Create an account</h1>
            <p className="auth-subtitle">Start your journey with Sukoon</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-password">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="signup-password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {password.length > 0 && (
                <div className="auth-strength-bar-wrap">
                  <div className={`auth-strength-bar ${strengthClass}`}>
                    <div className="auth-strength-fill" style={{ width: `${(strength / 3) * 100}%` }} />
                  </div>
                  <span className={`auth-strength-label ${strengthClass}`}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
              <input
                id="signup-confirm"
                className={`auth-input${confirm && confirm !== password ? " auth-input-error" : ""}`}
                type={showPassword ? "text" : "password"}
                placeholder="Repeat password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={loading}
              />
              {confirm && confirm !== password && (
                <span className="auth-field-hint">Passwords don't match</span>
              )}
            </div>

            <button
              id="signup-submit"
              className={`auth-btn${loading ? " auth-btn-loading" : ""}`}
              type="submit"
              disabled={loading || !email || !password || !confirm}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" /> Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
