"use client";
import { useMemo } from "react";
import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import { useApp } from "../../store/AppStore";

function StatCard({
  value, label, sub, danger = false,
}: {
  value: string; label: string; sub: string; danger?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="font-bold" style={{ fontSize: 30, lineHeight: 1.2, color: danger ? "#D64545" : "var(--text)" }}>
        {value}
      </div>
      <div className="text-sm font-medium mt-1" style={{ color: "var(--text)" }}>{label}</div>
      <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{sub}</div>
    </div>
  );
}

function WorkloadChart({ values }: { values: number[] }) {
  const days   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxVal = Math.max(35, ...values);
  const W = 500, H = 150, pL = 32, pR = 12, pT = 12, pB = 26;
  const cW = W - pL - pR, cH = H - pT - pB;

  const pts = values
    .map((v, i) => `${pL + (i / (values.length - 1)) * cW},${pT + (1 - v / maxVal) * cH}`)
    .join(" ");

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Weekly task volume
        </div>
        <div className="text-xs" style={{ color: "#6B7280" }}>Tasks per day — Week 50</div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weekly task volume chart">
        {[0, 0.5, 1].map((p, i) => (
          <g key={i}>
            <line x1={pL} y1={pT + p * cH} x2={pL + cW} y2={pT + p * cH} stroke="#E5E5E5" strokeWidth={1} />
            <text x={pL - 6} y={pT + p * cH + 4} textAnchor="end" fontSize={10} fill="#9CA3AF">
              {Math.round((1 - p) * maxVal)}
            </text>
          </g>
        ))}
        <polyline points={pts} fill="none" stroke="#E8B923" strokeWidth={2} strokeLinejoin="round" />
        {values.map((v, i) => {
          const x = pL + (i / (values.length - 1)) * cW;
          const y = pT + (1 - v / maxVal) * cH;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={3.5} fill="#FAFAFA" stroke="#E8B923" strokeWidth={2} />
              <text x={x} y={y - 8} textAnchor="middle" fontSize={10} fontWeight={600} style={{ fill: "var(--text)" }}>{v}</text>
            </g>
          );
        })}
        {days.map((d, i) => {
          const x = pL + (i / (days.length - 1)) * cW;
          return <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize={10} fill="#6B7280">{d}</text>;
        })}
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const { tasks, certs } = useApp();

  const open = useMemo(() => tasks.filter((t) => !["closed", "cancelled"].includes(t.status)), [tasks]);
  const pendingApproval = tasks.filter((t) => t.status === "submitted" || t.status === "pending").length;
  const expiringCerts = certs.filter((c) => c.expiry <= "2024-12-14" && !c.verified).length;
  const overdue = tasks.filter((t) => t.validityEnd < "2024-12-13" && !["closed", "cancelled"].includes(t.status)).length;

  const deadlines = useMemo(() => {
    const rank = (t: { status: string; validityEnd: string }) =>
      (["expired", "rejected"].includes(t.status) ? 0 : t.validityEnd <= "2024-12-14" ? 1 : 2);
    return [...open]
      .sort((a, b) => rank(a) - rank(b) || a.validityEnd.localeCompare(b.validityEnd))
      .slice(0, 5);
  }, [open]);

  const byType = (type: string) => tasks.filter((t) => t.type === type && !["closed", "cancelled"].includes(t.status)).length;
  const certsExpiring48h = certs.filter((c) => c.expiry <= "2024-12-14" && !c.verified).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Operations dashboard</h1>
        <p className="page-subtitle">Week 50 / 2024 — Refinery Complex Alpha</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={String(tasks.length)} label="Total tasks" sub="All open and closed jobs" />
        <StatCard value={String(pendingApproval)} label="Pending approval" sub="Awaiting review" />
        <StatCard value={String(expiringCerts)} label="Expiring this week" sub="Certificates due soon" danger={expiringCerts > 0} />
        <StatCard value={String(open.length)} label="Active workload" sub="Currently open tasks" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WorkloadChart values={[12, 18, 24, 16, 28, 9, 14]} />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Upcoming deadlines
            </div>
            <Link href="/tasks" className="link-action" style={{ fontSize: 12 }}>View all</Link>
          </div>
          {deadlines.length === 0 ? (
            <div className="text-xs" style={{ color: "#9CA3AF" }}>No open tasks — all clear.</div>
          ) : (
            <div className="space-y-4">
              {deadlines.map((d) => {
                const critical = d.status === "expired" || d.status === "rejected" || d.validityEnd < "2024-12-13";
                return (
                  <div key={d.id} className="pb-4 last:pb-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link href={`/tasks/${d.id}`} className="link-action">{d.id}</Link>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="text-xs" style={{ color: "#6B7280" }}>
                      {d.area} — {d.dept}
                    </div>
                    <div
                      className="text-xs mt-0.5 font-medium"
                      style={{ color: critical ? "#D64545" : "#6B7280" }}
                    >
                      Due {d.validityEnd}
                      {critical && " — Critical"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={String(byType("Hot Work Permit"))} label="Hot work permits" sub="Active this week" />
        <StatCard value={String(byType("Confined Space Entry"))} label="Confined space" sub="Entries logged" />
        <StatCard value={String(certsExpiring48h)} label="Certs expiring < 48h" sub="Require renewal" danger={certsExpiring48h > 0} />
        <StatCard value={String(overdue)} label="Overdue actions" sub="Require attention" danger={overdue > 0} />
      </div>
    </div>
  );
}
