"use client";
import { useApp } from "../store/AppStore";

export default function ToastHost() {
  const { toasts, dismissToast } = useApp();
  return (
    <div
      className="fixed flex flex-col gap-2 z-[100]"
      style={{ bottom: 24, right: 24, maxWidth: 360 }}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className="text-left text-sm px-4 py-3"
          style={{
            background: "#111827",
            color: "#FFFFFF",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(17,24,39,0.25)",
            cursor: "pointer",
            border: "none",
          }}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
