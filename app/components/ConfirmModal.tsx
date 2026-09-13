"use client";
import { useState } from "react";

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger = false,
  needsReason = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  needsReason?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (needsReason && !reason.trim()) {
      setError("Please provide a reason — it will be recorded in the task history.");
      return;
    }
    onConfirm(reason.trim() || undefined);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(17, 24, 39, 0.45)" }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full mx-4 p-6"
        style={{ maxWidth: 440, background: "var(--surface)", borderRadius: 8, boxShadow: "0 12px 40px rgba(17,24,39,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-base font-semibold mb-2" style={{ color: "var(--text)" }}>{title}</div>
        <p className="text-sm mb-4" style={{ color: "#6B7280" }}>{message}</p>
        {needsReason && (
          <div className="mb-4">
            <label className="field-label" htmlFor="confirm-reason">Reason (required)</label>
            <textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
              rows={3}
              className="ctrl-input w-full"
              placeholder="Enter the reason for this action…"
            />
            {error && <div className="text-xs mt-1 font-medium" style={{ color: "#D64545" }}>{error}</div>}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={handleConfirm} className={danger ? "btn-danger" : "btn-primary"}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
