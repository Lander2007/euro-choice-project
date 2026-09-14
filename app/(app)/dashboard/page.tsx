"use client";
import { useMemo } from "react";
import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import { useApp } from "../../store/AppStore";

/* ── Inline trend sparkline (tiny, decorative-but-labelled) ── */
function Sparkline({
  values, stroke, label,
}: {
  values: number[]; stroke: string; label: string;
}) {
  const W = 96, H = 28, P = 3;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(P + (i / (values.length - 1)) * (W - P * 2)).toFixed(1)},${(H - P - ((v - min) / span) * (H - P * 2)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Delta({ text, tone }: { text: string; tone: "red" | "grey" }) {
  return (
    <span
      className="text-xs font-semibold whitespace-nowrap"
      style={{ color: tone === "red" ? "#D64545" : "#6B7280" }}
    >
      {text}
    </span>
  );
}

/* Status dot for manifest rows — palette only: red critical, blue info, grey neutral */
function StatusDot({ status, critical }: { status: string; critical: boolean }) {
  const color =
    status === "expired" || status === "rejected" || critical
      ? "#D64545"
      : status === "submitted" || status === "ongoing" || status === "approved"
        ? "#3B82F6"
        : "#9CA3AF";
  return (
    <span
      aria-hidden="true"
      className="inline-block rounded-full flex-shrink-0"
      style={{ width: 8, height: 8, background: color }}
    />
  );
}

export default function DashboardPage() {
  const { tasks, certs } = useApp();

  const open = useMemo(
    () => tasks.filter((t) => !["closed", "cancelled"].includes(t.status)),
    [tasks]
  );
  const pendingApproval = tasks.filter((t) => t.status === "submitted" || t.status === "pending").length;
  const due48h = tasks.filter(
    (t) => t.validityEnd <= "2024-12-14" && !["closed", "cancelled", "expired"].includes(t.status)
  ).length;
  const expiringCerts = certs.filter((c) => c.expiry <= "2024-12-14" && !c.verified).length;
  const overdue = tasks.filter(
    (t) => t.validityEnd < "2024-12-13" && !["closed", "cancelled"].includes(t.status)
  ).length;

  const deadlines = useMemo(() => {
    const rank = (t: { status: string; validityEnd: string }) =>
      (["expired", "rejected"].includes(t.status) ? 0 : t.validityEnd <= "2024-12-14" ? 1 : 2);
    return [...open]
      .sort((a, b) => rank(a) - rank(b) || a.validityEnd.localeCompare(b.validityEnd))
      .slice(0, 7);
  }, [open]);

  const permitMix = useMemo(() => {
    const types = [...new Set(open.map((t) => t.type))];
    const rows = types.map((type) => ({
      type,
      count: open.filter((t) => t.type === type).length,
    })).sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [open]);

  return (
    <div className="space-y-5">
      {/* Masthead — manifest header, not a marketing hero */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase" style={{ letterSpacing: "0.08em", color: "#6B7280" }}>
            Daily operations manifest
          </div>
          <h1 className="page-title">Friday 13 Dec 2024 — Week 50</h1>
          <p className="page-subtitle">Refinery Complex Alpha · {open.length} open tasks on the board</p>
        </div>
        <Link href="/tasks" className="btn-secondary" style={{ fontSize: 13 }}>
          Open task register
        </Link>
      </div>

      {/* Asymmetric workload block: dominant hero + ledger strips */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Hero — the one actionable number */}
        <section
          className="card xl:col-span-5 p-6 flex flex-col justify-between"
          aria-label="Pending approvals summary"
          style={{ borderTop: "4px solid var(--primary)" }}
        >
          <div className="flex items-center justify-between">
            <span className="badge badge-yellow">Needs decision</span>
            <Delta text="▲ 2 vs last Fri" tone={pendingApproval > 0 ? "red" : "grey"} />
          </div>
          <div className="my-4">
            <div
              className="font-extrabold"
              style={{
                fontSize: "clamp(56px, 7vw, 84px)",
                lineHeight: 1,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {pendingApproval}
            </div>
            <div className="text-base font-semibold mt-2" style={{ color: "var(--text)" }}>
              Pending approvals
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
              Awaiting review · {due48h} due within 48h
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <Sparkline values={[3, 5, 4, 6, 5, 7, 8]} stroke="#3B82F6" label="Pending approvals trend, rising over the last 7 days" />
            <Link href="/tasks" className="link-action whitespace-nowrap" style={{ fontSize: 13 }}>
              Review queue →
            </Link>
          </div>
        </section>

        {/* Shift summary — compact ledger strips, not equal cards */}
        <section className="card xl:col-span-7 p-2" aria-label="Shift summary">
          {[
            {
              label: "Active workload",
              sub: "Open tasks on the board",
              value: open.length,
              delta: <Delta text="▲ 3 vs last Fri" tone="grey" />,
              spark: <Sparkline values={[9, 11, 10, 13, 12, 14, 15]} stroke="#6B7280" label="Active workload trend over the last 7 days" />,
            },
            {
              label: "Certificates expiring < 48h",
              sub: "Require renewal before work starts",
              value: expiringCerts,
              delta: <Delta text={expiringCerts > 0 ? "▲ needs action" : "— clear"} tone={expiringCerts > 0 ? "red" : "grey"} />,
              spark: <Sparkline values={[1, 2, 1, 3, 2, 4, 5]} stroke={expiringCerts > 0 ? "#D64545" : "#9CA3AF"} label="Expiring certificates trend over the last 7 days" />,
            },
            {
              label: "Overdue actions",
              sub: "Past validity with work still open",
              value: overdue,
              delta: <Delta text={overdue > 0 ? "▲ needs action" : "— clear"} tone={overdue > 0 ? "red" : "grey"} />,
              spark: <Sparkline values={[2, 2, 1, 2, 1, 1, 2]} stroke={overdue > 0 ? "#D64545" : "#9CA3AF"} label="Overdue actions trend over the last 7 days" />,
            },
          ].map((row, i) => (
            <div
              key={row.label}
              className="flex items-center gap-4 px-4 py-4"
              style={i > 0 ? { borderTop: "1px solid var(--border-soft)" } : undefined}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{row.label}</div>
                <div className="text-xs truncate" style={{ color: "#6B7280" }}>{row.sub}</div>
              </div>
              <div className="hidden sm:block">{row.spark}</div>
              <div className="text-right flex-shrink-0">
                <div
                  className="font-bold"
                  style={{ fontSize: 28, lineHeight: 1.1, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}
                >
                  {row.value}
                </div>
                {row.delta}
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Manifest + permit mix */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Upcoming deadlines — dense log lines */}
        <section className="card xl:col-span-7" aria-label="Upcoming deadlines">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Upcoming deadlines
            </div>
            <Link href="/tasks" className="link-action" style={{ fontSize: 12 }}>View all</Link>
          </div>
          {/* Column header — log-book style */}
          <div
            className="hidden sm:grid px-5 pb-2 text-xs font-semibold uppercase"
            style={{ gridTemplateColumns: "16px 130px 1fr 92px 110px", gap: 12, letterSpacing: "0.05em", color: "#9CA3AF" }}
            aria-hidden="true"
          >
            <span />
            <span>Task</span>
            <span>Area / unit</span>
            <span>Due</span>
            <span>Status</span>
          </div>
          <div style={{ borderTop: "1px solid var(--border-soft)" }}>
            {deadlines.length === 0 ? (
              <div className="text-xs px-5 py-6" style={{ color: "#9CA3AF" }}>No open tasks — all clear.</div>
            ) : (
              deadlines.map((d, i) => {
                const critical = d.status === "expired" || d.status === "rejected" || d.validityEnd < "2024-12-13";
                return (
                  <Link
                    key={d.id}
                    href={`/tasks/${d.id}`}
                    className="grid items-center px-5 py-2.5"
                    style={{
                      gridTemplateColumns: "16px 130px 1fr 92px 110px",
                      gap: 12,
                      borderTop: i === 0 ? "none" : "1px solid var(--border-soft)",
                      textDecoration: "none",
                    }}
                  >
                    <StatusDot status={d.status} critical={critical} />
                    <span className="text-xs font-semibold truncate" style={{ color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                      {d.id.replace("TSK-2024-", "…")}
                    </span>
                    <span className="text-xs truncate" style={{ color: "#4B5563" }} title={`${d.area} — ${d.dept}`}>
                      {d.area} <span style={{ color: "#9CA3AF" }}>· {d.dept}</span>
                    </span>
                    <span
                      className="text-xs whitespace-nowrap"
                      style={{ color: critical ? "#D64545" : "#4B5563", fontWeight: critical ? 700 : 400, fontVariantNumeric: "tabular-nums" }}
                    >
                      {d.validityEnd}
                    </span>
                    <span><StatusBadge status={d.status} /></span>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Permit mix — compact density bars */}
        <section className="card xl:col-span-5 p-5" aria-label="Open work by permit type">
          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Open work by permit type
          </div>
          <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
            {open.length} open tasks across {permitMix.rows.length} permit types
          </p>
          <div>
            {permitMix.rows.map((r) => (
              <div key={r.type} className="py-2" style={{ borderTop: "1px solid var(--border-soft)" }}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{r.type}</span>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                    {r.count}
                  </span>
                </div>
                <div className="mt-1.5 rounded-full" style={{ height: 4, background: "var(--border-soft)" }}>
                  <div
                    className="rounded-full"
                    style={{ height: 4, width: `${Math.round((r.count / permitMix.max) * 100)}%`, background: "#3B82F6" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
