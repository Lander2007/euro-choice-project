"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/* ── Analog gauge ────────────────────────────────────────────────── */
function AnalogGauge({
  value, max, label, unit = "", warningColor = "#E3B23C",
}: {
  value: number; max: number; label: string; unit?: string; warningColor?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const pct      = Math.min(value / max, 1);
  const minAngle = -130;
  const maxAngle =  130;
  const angle    = mounted ? minAngle + pct * (maxAngle - minAngle) : minAngle;
  const cx = 70, cy = 70, r = 52;

  /* tick marks */
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = ((minAngle + (i / 10) * (maxAngle - minAngle)) * Math.PI) / 180;
    const isMajor = i % 2 === 0;
    const r1 = isMajor ? r - 6 : r - 4;
    const r2 = r - 11;
    return {
      x1: cx + r1 * Math.sin(a), y1: cy - r1 * Math.cos(a),
      x2: cx + r2 * Math.sin(a), y2: cy - r2 * Math.cos(a),
      isMajor,
    };
  });

  /* hazard arc (top 25% of range) */
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcStartAngle = minAngle + 0.75 * (maxAngle - minAngle);
  const ax1 = cx + (r - 3) * Math.sin(toRad(arcStartAngle));
  const ay1 = cy - (r - 3) * Math.cos(toRad(arcStartAngle));
  const ax2 = cx + (r - 3) * Math.sin(toRad(maxAngle));
  const ay2 = cy - (r - 3) * Math.cos(toRad(maxAngle));

  return (
    <div
      className="eng-panel rounded-sm p-4 flex flex-col items-center"
      style={{ gap: 4 }}
    >
      <svg width={140} height={120} viewBox="0 0 140 120">
        {/* Gauge bezel */}
        <circle cx={cx} cy={cy} r={r + 9} fill="#1E1B16" stroke="#3A3530" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={r + 4} fill="#141210" stroke="#2A2520" strokeWidth={0.5} />
        <circle cx={cx} cy={cy} r={r}     fill="#0E0C09" stroke="none" />

        {/* Hazard arc */}
        <path
          d={`M ${ax1} ${ay1} A ${r - 3} ${r - 3} 0 0 1 ${ax2} ${ay2}`}
          stroke={warningColor} strokeWidth={3} fill="none" opacity={0.85}
        />

        {/* Ticks */}
        {ticks.map((t, i) => (
          <line
            key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? "#7A7670" : "#3A3530"}
            strokeWidth={t.isMajor ? 1.5 : 0.8}
          />
        ))}

        {/* Needle — CSS transition for the sweep */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: mounted ? "transform 1.8s cubic-bezier(0.22, 0.61, 0.36, 1)" : "none",
          }}
        >
          <line
            x1={cx} y1={cy + 9} x2={cx} y2={cy - 40}
            stroke={warningColor} strokeWidth={1.5} strokeLinecap="round"
          />
          <polygon
            points={`${cx},${cy - 40} ${cx - 2},${cy - 32} ${cx + 2},${cy - 32}`}
            fill={warningColor}
          />
          {/* Counterweight */}
          <line
            x1={cx} y1={cy + 9} x2={cx} y2={cy + 16}
            stroke="#6E6A5E" strokeWidth={3} strokeLinecap="round"
          />
        </g>

        {/* Centre cap */}
        <circle cx={cx} cy={cy} r={5}   fill="#2A2520" stroke="#4A4840" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={2.5} fill={warningColor} />

        {/* Value text */}
        <text x={cx} y={cy + 24} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={15} fontWeight={700} fill={warningColor}>
          {value}
        </text>
        <text x={cx} y={cy + 34} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={8} fill="#6E6A5E">
          {unit}
        </text>
      </svg>
      <div
        className="font-stencil text-xs text-center"
        style={{ color: "#6E6A5E", fontSize: 10, letterSpacing: "0.08em" }}
      >
        {label}
      </div>
    </div>
  );
}

/* ── Workload recorder chart ─────────────────────────────────────── */
function WorkloadChart() {
  const days   = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const values = [12, 18, 24, 16, 28, 9, 14];
  const maxVal = 35;
  const W = 500, H = 140, pL = 36, pR = 16, pT = 12, pB = 28;
  const cW = W - pL - pR, cH = H - pT - pB;

  const pts = values
    .map((v, i) => `${pL + (i / (values.length - 1)) * cW},${pT + (1 - v / maxVal) * cH}`)
    .join(" ");

  const area = [
    `${pL},${pT + cH}`,
    ...values.map((v, i) => `${pL + (i / (values.length - 1)) * cW},${pT + (1 - v / maxVal) * cH}`),
    `${pL + cW},${pT + cH}`,
  ].join(" ");

  return (
    <div className="eng-panel rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-stencil text-sm font-semibold" style={{ color: "#1E1B16" }}>
          Weekly Task Volume
        </div>
        <div className="font-mono text-xs" style={{ color: "#9A9589" }}>Tasks / day — Week 50</div>
      </div>
      <div
        className="rounded-sm overflow-hidden"
        style={{
          background: "#EDE5CE",
          backgroundImage:
            "linear-gradient(rgba(110,106,94,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(110,106,94,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          padding: "8px 4px 4px",
        }}
      >
        <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <g key={i}>
              <line
                x1={pL} y1={pT + p * cH} x2={pL + cW} y2={pT + p * cH}
                stroke="rgba(110,106,94,0.3)"
                strokeWidth={p === 0 || p === 1 ? 1.2 : 0.6}
                strokeDasharray={p === 0 || p === 1 ? "" : "3,4"}
              />
              <text x={pL - 4} y={pT + p * cH + 4} textAnchor="end" fontFamily="IBM Plex Mono" fontSize={8} fill="#6E6A5E">
                {Math.round((1 - p) * maxVal)}
              </text>
            </g>
          ))}
          {days.map((_, i) => {
            const x = pL + (i / (days.length - 1)) * cW;
            return <line key={i} x1={x} y1={pT} x2={x} y2={pT + cH} stroke="rgba(110,106,94,0.15)" strokeWidth={0.6} />;
          })}
          <polygon points={area} fill="rgba(227,178,60,0.12)" />
          <polyline points={pts} fill="none" stroke="#C49020" strokeWidth={1.5} strokeLinejoin="round" />
          {values.map((v, i) => {
            const x = pL + (i / (values.length - 1)) * cW;
            const y = pT + (1 - v / maxVal) * cH;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={3.5} fill="#FAF7F0" stroke="#C49020" strokeWidth={1.5} />
                <text x={x} y={y - 7} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={8} fill="#1E1B16" fontWeight={600}>{v}</text>
              </g>
            );
          })}
          {days.map((d, i) => {
            const x = pL + (i / (days.length - 1)) * cW;
            return <text key={i} x={x} y={H - 5} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={8} fill="#6E6A5E">{d}</text>;
          })}
        </svg>
      </div>
    </div>
  );
}

/* ── Deadline list ────────────────────────────────────────────────── */
const DEADLINES = [
  { id: "TSK-2024-0847", area: "Unit-3 Reformer",    dept: "Maintenance", deadline: "2024-12-14", status: "pending",   urgency: "critical" },
  { id: "TSK-2024-0851", area: "Crude Distillation", dept: "Operations",  deadline: "2024-12-15", status: "ongoing",   urgency: "high"     },
  { id: "TSK-2024-0839", area: "Hydrogen Plant",      dept: "Safety",      deadline: "2024-12-16", status: "submitted", urgency: "high"     },
  { id: "TSK-2024-0862", area: "Storage Tank Farm",   dept: "Inspection",  deadline: "2024-12-17", status: "approved",  urgency: "medium"   },
  { id: "TSK-2024-0855", area: "Flare Stack",         dept: "HSE",         deadline: "2024-12-18", status: "ongoing",   urgency: "medium"   },
];

const STATUS_LED: Record<string, string> = {
  approved: "led-green", ongoing: "led-green", submitted: "led-yellow",
  pending:  "led-yellow", expired: "led-red",  rejected:  "led-red",
  returned: "led-amber",  closed:  "led-grey", cancelled: "led-grey",
};

/* ── Page ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-stencil text-2xl font-bold" style={{ color: "#1E1B16" }}>
            Operations Dashboard
          </h1>
          <p className="font-mono text-xs mt-1" style={{ color: "#9A9589" }}>
            Week 50 / 2024 — Refinery Complex Alpha — Live status
          </p>
        </div>
        <div className="eng-panel rounded-sm px-4 py-2 flex items-center gap-2">
          <div className="led led-green" />
          <span className="font-mono text-xs" style={{ color: "#6E6A5E" }}>Live feed</span>
        </div>
      </div>

      {/* Section label */}
      <div
        className="font-stencil text-xs"
        style={{
          color: "#9A9589",
          borderBottom: "1px solid #D4CCB8",
          paddingBottom: 6,
          letterSpacing: "0.1em",
        }}
      >
        Key Performance Indicators — Analog Display
      </div>

      {/* Gauge row */}
      <div className="grid grid-cols-4 gap-4">
        <AnalogGauge value={124} max={200} label="Total Tasks"         unit="jobs"  warningColor="#E3B23C" />
        <AnalogGauge value={31}  max={60}  label="Pending Approval"    unit="tasks" warningColor="#E3B23C" />
        <AnalogGauge value={8}   max={20}  label="Expiring This Week"  unit="certs" warningColor="#C1402A" />
        <AnalogGauge value={47}  max={80}  label="Active Workload"     unit="open"  warningColor="#E3B23C" />
      </div>

      {/* Chart + Deadlines */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <WorkloadChart />
        </div>

        {/* Upcoming deadlines */}
        <div className="eng-panel rounded-sm p-5">
          <div className="font-stencil text-sm font-semibold mb-4" style={{ color: "#1E1B16" }}>
            Upcoming Deadlines
          </div>
          <div className="space-y-3">
            {DEADLINES.map((d) => (
              <div
                key={d.id}
                className="pb-3 border-b last:border-0 last:pb-0"
                style={{ borderColor: "#E8E0CC" }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`led ${STATUS_LED[d.status]}`} />
                  <Link href={`/tasks/${d.id}`}>
                    <span className="font-mono text-xs font-bold" style={{ color: "#1E1B16" }}>
                      {d.id}
                    </span>
                  </Link>
                </div>
                <div className="font-sans text-xs" style={{ color: "#6E6A5E" }}>
                  {d.area} — {d.dept}
                </div>
                <div
                  className="font-mono text-xs mt-0.5"
                  style={{
                    color: d.urgency === "critical"
                      ? "#C1402A"
                      : d.urgency === "high"
                      ? "#C49020"
                      : "#9A9589",
                  }}
                >
                  Due {d.deadline}
                  {d.urgency === "critical" && (
                    <span style={{ marginLeft: 6 }}>— CRITICAL</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Hot Work Permits",    value: "38", sub: "active this week" },
          { label: "Confined Space",       value: "12", sub: "entries logged"   },
          { label: "Certs Expiring < 48h", value: "5",  sub: "require renewal"  },
          { label: "Overdue Actions",      value: "3",  sub: "require attention" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="eng-panel rounded-sm px-4 py-3">
            <div className="font-mono text-2xl font-bold" style={{ color: "#1E1B16" }}>{value}</div>
            <div className="font-stencil text-xs mt-0.5" style={{ color: "#6E6A5E" }}>{label}</div>
            <div className="font-sans text-xs mt-0.5" style={{ color: "#9A9589" }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
