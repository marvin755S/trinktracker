"use client";

export default function LoadingOverlay() {
  return (
    <div
      className="loading-overlay"
      role="status"
      aria-label="Wird geladen"
    >
      <div className="loading-card">
        <span className="loading-dot" />
        <span className="loading-dot [animation-delay:150ms]" />
        <span className="loading-dot [animation-delay:300ms]" />
      </div>
    </div>
  );
}