"use client";
import { useState } from "react";
import Link from "next/link";

const PIPELINE_STAGES = ["Created", "Submitted", "Received", "Approved", "Ongoing", "Closed"];
const BRANCH_STAGES   = ["Expired", "Rejected", "Returned", "Cancelled"];

const MOCK_TASK = {
  id:           "TSK-2024-0847",
  dept:         "Maintenance",
  area:         "Unit-3 Reformer",
  type:         "Hot Work Permit",
  shortDesc:    "Replacement of corroded heat exchanger tubes — E-301A",
  longDesc:     "Scope of work includes: isolation of E-301A heat exchanger, hot-cutting and removal of deteriorated tube bundle (metallurgy Grade 321 SS), NDT inspection of shell-side welds, installation of new tube bundle, pressure testing at 1.5× MAWP (8.5 barg), reinstatement and recommissioning. Area classification: Zone 1 — flammable atmosphere possible. Fire watch required throughout. Concurrent work freeze in adjacent E-302 area.",
  submitted:    "2024-12-09",
  validityStart:"2024-12-09",
  validityEnd:  "2024-12-16",
  currentStage: "Submitted",
  assignedTo:   "Ahmed Al-Rashidi",
  receivedBy:   "Samir Okafor",
  status:       "submitted",
};

const REMARKS = [
  { ts: "2024-12-09 08:14", user: "Ahmed Al-Rashidi",   role: "Requester", text: "Initial submission. All isolation points confirmed with Shift Supervisor. P&ID Rev 7 attached for reference." },
  { ts: "2024-12-09 10:31", user: "Samir Okafor",        role: "Receiver",  text: "Received and logged. Forwarded to Approver queue. Area walkdown scheduled for 14:00." },
  { ts: "2024-12-09 15:45", user: "Eng. Layla Mansour",  role: "Approver",  text: "HOLD — Gas test certificate must be less than 4 hours old at time of work start. Please resubmit with gas test certificate dated day-of-work." },
  { ts: "2024-12-10 07:55", user: "Ahmed Al-Rashidi",   role: "Requester", text: "Noted. Gas test cert will be obtained from HSE on day of work. No other changes to scope." },
];

const ACTION_LOG = [
  { ts: "2024-12-09 08:14", user: "Ahmed Al-Rashidi",   action: "Created",     from: null,        to: "Created"   },
  { ts: "2024-12-09 08:18", user: "Ahmed Al-Rashidi",   action: "Submitted",   from: "Created",   to: "Submitted" },
  { ts: "2024-12-09 10:31", user: "Samir Okafor",        action: "Received",    from: "Submitted", to: "Received"  },
  { ts: "2024-12-09 15:47", user: "Eng. Layla Mansour",  action: "Returned",    from: "Received",  to: "Returned"  },
  { ts: "2024-12-10 07:57", user: "Ahmed Al-Rashidi",   action: "Resubmitted", from: "Returned",  to: "Submitted" },
];

const CERT_CHECKLIST = [
  { id: "GAS-001",  type: "Gas Test Certificate",            number: "GTC-2024-4421", issuer: "Hassan Al-Mutairi",  issued: "2024-12-09", expiry: "2024-12-10", verified: false },
  { id: "FIRE-001", type: "Fire Watch Authorization",         number: "FWA-2024-1183", issuer: "Fire & Safety Dept", issued: "2024-12-09", expiry: "2024-12-16", verified: true  },
  { id: "ISO-001",  type: "Mechanical Isolation Certificate", number: "MIC-2024-0872", issuer: "Samir Okafor",        issued: "2024-12-08", expiry: "2024-12-16", verified: true  },
  { id: "PTW-001",  type: "Cold Work Pre-Check",              number: "CWP-2024-2201", issuer: "Eng. Layla Mansour", issued: "2024-12-09", expiry: "2024-12-16", verified: false },
];

export default function TaskDetailPage() {
  const [certs,  setCerts]  = useState(CERT_CHECKLIST);
  const [remark, setRemark] = useState("");

  const currentIdx = PIPELINE_STAGES.indexOf(MOCK_TASK.currentStage);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Breadcrumb */}
      <div className="font-mono text-xs" style={{ color: "#9A9589" }}>
        <Link href="/tasks" style={{ color: "#9A9589", textDecoration: "none" }}>Tasks</Link>
        {" › "}
        <span style={{ color: "#1E1B16" }}>{MOCK_TASK.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-stencil text-2xl font-bold" style={{ color: "#1E1B16" }}>{MOCK_TASK.id}</h1>
          <p className="font-sans text-sm mt-1" style={{ color: "#6E6A5E" }}>
            {MOCK_TASK.type} — {MOCK_TASK.area} — {MOCK_TASK.dept}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">Clone</button>
          <button className="btn-primary">Submit</button>
        </div>
      </div>

      {/* Pipeline status flow */}
      <div className="eng-panel rounded-sm p-5">
        <div className="font-stencil text-xs mb-5" style={{ color: "#9A9589", letterSpacing: "0.1em" }}>
          Status Flow — Pipeline Schematic
        </div>
        <div className="flex items-center">
          {PIPELINE_STAGES.map((stage, i) => {
            const past    = i < currentIdx;
            const current = stage === MOCK_TASK.currentStage;
            return (
              <div key={stage} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <svg width={28} height={28} viewBox="0 0 28 28">
                    <circle cx={14} cy={14} r={12}
                      fill={current ? "#1E1B16" : past ? "#EDE5CE" : "#FAF7F0"}
                      stroke={current ? "#E3B23C" : past ? "#9A9589" : "#D4CCB8"}
                      strokeWidth={1.5} />
                    <line x1={14} y1={6} x2={14} y2={22} stroke={current ? "#E3B23C" : past ? "#6E6A5E" : "#C4BAA0"} strokeWidth={2} />
                    <line x1={6} y1={14} x2={22} y2={14} stroke={current ? "#E3B23C" : past ? "#6E6A5E" : "#C4BAA0"} strokeWidth={2} />
                    {current && <circle cx={14} cy={14} r={4} fill="#E3B23C" />}
                    {past    && <circle cx={14} cy={14} r={3} fill="#9A9589" />}
                  </svg>
                  <div className="font-stencil text-center" style={{
                    fontSize: 9, letterSpacing: "0.06em",
                    color: current ? "#1E1B16" : past ? "#6E6A5E" : "#B4ACAA",
                    fontWeight: current ? 700 : 400,
                  }}>
                    {stage}
                  </div>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div style={{ width: 40, height: 3, marginBottom: 18,
                    background: past || current ? "linear-gradient(90deg,#9A9589,#C4BAA0)" : "#E8E0CC" }} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 flex items-center gap-6" style={{ borderTop: "1px solid #E8E0CC" }}>
          <span className="font-stencil text-xs" style={{ color: "#B4ACAA", fontSize: 9 }}>Branch paths:</span>
          {BRANCH_STAGES.map((stage) => (
            <div key={stage} className="flex items-center gap-1.5">
              <div style={{ width: 14, height: 2, background: "#C1402A", opacity: 0.5 }} />
              <span className="font-stencil" style={{ fontSize: 9, color: "#C1402A" }}>{stage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task fields + descriptions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="eng-panel rounded-sm p-5">
          <div className="font-stencil text-xs mb-4" style={{ color: "#9A9589", letterSpacing: "0.1em" }}>Task Information</div>
          <div className="space-y-2.5">
            {[
              ["Task ID",        MOCK_TASK.id],
              ["Department",     MOCK_TASK.dept],
              ["Area / Unit",    MOCK_TASK.area],
              ["Permit Type",    MOCK_TASK.type],
              ["Submitted",      MOCK_TASK.submitted],
              ["Validity Start", MOCK_TASK.validityStart],
              ["Validity End",   MOCK_TASK.validityEnd],
              ["Assigned To",    MOCK_TASK.assignedTo],
              ["Received By",    MOCK_TASK.receivedBy],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <div className="font-stencil text-xs flex-shrink-0" style={{ color: "#9A9589", width: 120, fontSize: 10 }}>{label}</div>
                <div className="font-mono text-xs" style={{ color: "#1E1B16" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="eng-panel rounded-sm p-4">
            <div className="font-stencil text-xs mb-2" style={{ color: "#9A9589", fontSize: 10 }}>Short Description</div>
            <div className="font-sans text-sm" style={{ color: "#1E1B16" }}>{MOCK_TASK.shortDesc}</div>
          </div>
          <div className="eng-panel rounded-sm p-4 flex-1">
            <div className="font-stencil text-xs mb-2" style={{ color: "#9A9589", fontSize: 10 }}>Scope of Work</div>
            <div className="font-sans text-xs leading-relaxed" style={{ color: "#6E6A5E" }}>{MOCK_TASK.longDesc}</div>
          </div>
        </div>
      </div>

      {/* Certificate checklist */}
      <div className="eng-panel rounded-sm p-5">
        <div className="font-stencil text-sm font-semibold mb-4" style={{ color: "#1E1B16" }}>Certificate Verification Checklist</div>
        <div className="table-wrap blueprint-bg">
          <table>
            <thead>
              <tr>
                <th>Ref</th><th>Certificate Type</th><th>Number</th>
                <th>Issuing Authority</th><th>Issued</th><th>Expiry</th><th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((cert) => (
                <tr key={cert.id}>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-mono text-xs" style={{ color: "#9A9589" }}>{cert.id}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-sans text-sm" style={{ color: "#1E1B16" }}>{cert.type}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-mono text-xs font-bold" style={{ color: "#1E1B16" }}>{cert.number}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-sans text-xs" style={{ color: "#6E6A5E" }}>{cert.issuer}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-mono text-xs" style={{ color: "#6E6A5E" }}>{cert.issued}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-mono text-xs" style={{ color: cert.expiry <= "2024-12-14" ? "#C1402A" : "#6E6A5E", fontWeight: cert.expiry <= "2024-12-14" ? 600 : 400 }}>
                      {cert.expiry}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <button onClick={() => setCerts((p) => p.map((c) => c.id === cert.id ? { ...c, verified: !c.verified } : c))}
                      className="flex items-center gap-2">
                      <div className={`led ${cert.verified ? "led-green" : "led-grey"}`} />
                      <span className="font-stencil text-xs" style={{ color: cert.verified ? "#2E8018" : "#9A9589", fontSize: 9 }}>
                        {cert.verified ? "Verified" : "Unverified"}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks + Action log */}
      <div className="grid grid-cols-2 gap-4">
        <div className="eng-panel rounded-sm p-5">
          <div className="font-stencil text-sm font-semibold mb-4" style={{ color: "#1E1B16" }}>Remarks Timeline</div>
          <div className="space-y-4 mb-4">
            {REMARKS.map((r, i) => (
              <div key={i} className="pl-3 border-l-2" style={{ borderColor: "#D4CCB8" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-sans text-xs font-semibold" style={{ color: "#1E1B16" }}>{r.user}</span>
                  <span className="font-stencil px-1.5 py-0.5 rounded-sm" style={{ fontSize: 9, background: "#EDE5CE", color: "#6E6A5E" }}>{r.role}</span>
                </div>
                <p className="font-sans text-xs leading-snug mb-1" style={{ color: "#6E6A5E" }}>{r.text}</p>
                <div className="font-mono text-xs" style={{ color: "#B4ACAA", fontSize: 9 }}>{r.ts}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid #E8E0CC" }}>
            <input value={remark} onChange={(e) => setRemark(e.target.value)}
              placeholder="Add remark…" className="ctrl-input flex-1" />
            <button className="btn-primary" style={{ padding: "8px 14px" }}>Add</button>
          </div>
        </div>

        <div className="eng-panel rounded-sm p-5">
          <div className="font-stencil text-sm font-semibold mb-4" style={{ color: "#1E1B16" }}>Action History Log</div>
          <div className="space-y-3">
            {ACTION_LOG.map((a, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: "#E8E0CC" }}>
                <span className="font-stencil text-xs px-2 py-0.5 rounded-sm flex-shrink-0"
                  style={{ background: "#EDE5CE", color: "#6E6A5E", fontSize: 9 }}>{a.action}</span>
                <div>
                  <div className="font-sans text-xs font-medium" style={{ color: "#1E1B16" }}>{a.user}</div>
                  {a.from && <div className="font-mono text-xs" style={{ color: "#9A9589", fontSize: 9 }}>{a.from} → {a.to}</div>}
                  <div className="font-mono text-xs" style={{ color: "#B4ACAA", fontSize: 9 }}>{a.ts}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
