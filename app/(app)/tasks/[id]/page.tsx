"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ConfirmModal from "../../../components/ConfirmModal";
import StatusBadge from "../../../components/StatusBadge";
import { allowedActions, can, cap, useApp, type StatusAction } from "../../../store/AppStore";

const PIPELINE_STAGES = ["Created", "Submitted", "Received", "Approved", "Ongoing", "Closed"];
const BRANCH_STAGES   = ["Expired", "Rejected", "Returned", "Cancelled"];
const BRANCH_RED = new Set(["Expired", "Rejected"]);

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const {
    getTask, role, cloneTask, transitionTask, pushToast,
    remarks, logs, addRemark,
  } = useApp();
  const [remark, setRemark] = useState("");
  const [confirming, setConfirming] = useState<StatusAction | null>(null);

  const task = getTask(decodeURIComponent(id || ""));

  if (!task) {
    return (
      <div className="space-y-4">
        <div className="text-xs" style={{ color: "#6B7280" }}>
          <Link href="/tasks" style={{ color: "#6B7280", textDecoration: "none" }}>Tasks</Link>
          {" / "}
          <span style={{ color: "var(--text)" }}>{id}</span>
        </div>
        <div className="card p-10 text-center">
          <div className="text-base font-semibold" style={{ color: "var(--text)" }}>Task not found</div>
          <p className="text-sm mt-1 mb-4" style={{ color: "#6B7280" }}>
            This task does not exist or was removed.
          </p>
          <Link href="/tasks"><button className="btn-secondary">Back to tasks</button></Link>
        </div>
      </div>
    );
  }

  const taskRemarks = [...(remarks[task.id] || [])].sort((a, b) => a.ts.localeCompare(b.ts));
  const taskLogs = [...(logs[task.id] || [])].sort((a, b) => a.ts.localeCompare(b.ts));
  const actions = allowedActions(task.status, role);
  const canClone = can(role, "clone");
  const isExpired = task.status === "expired";

  const stageIdx = PIPELINE_STAGES.findIndex(
    (s) => s.toLowerCase() === (task.status === "pending" ? "submitted" : task.status)
  );
  const isBranch = stageIdx === -1;

  const handleClone = () => {
    const copy = cloneTask(task.id);
    if (copy) pushToast(`Task cloned as ${copy.id}`);
  };

  const runAction = (action: StatusAction, reason?: string) => {
    transitionTask(task.id, action, reason);
    pushToast(`Status updated to ${cap(action.to)}`);
    setConfirming(null);
  };

  const handleAddRemark = () => {
    if (!remark.trim()) return;
    addRemark(task.id, remark);
    setRemark("");
    pushToast("Remark added");
  };

  const forward = actions.filter((a) => !["reject", "cancel", "close", "return"].includes(a.id));
  const review  = actions.filter((a) => ["return", "reject"].includes(a.id));
  const terminal = actions.filter((a) => ["cancel", "close"].includes(a.id));

  return (
    <div className="space-y-6" style={{ maxWidth: 1024 }}>
      {confirming && (
        <ConfirmModal
          title={`${confirming.label} task`}
          message={confirming.confirm || `Move ${task.id} to ${cap(confirming.to)}?`}
          confirmLabel={confirming.label}
          danger={confirming.id === "reject" || confirming.id === "cancel"}
          needsReason={confirming.needsReason}
          onConfirm={(reason) => runAction(confirming, reason)}
          onCancel={() => setConfirming(null)}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-xs" style={{ color: "#6B7280" }}>
          <Link href="/tasks" style={{ color: "#6B7280", textDecoration: "none" }}>Tasks</Link>
          {" / "}
          <span style={{ color: "var(--text)", fontWeight: 500 }}>{task.id}</span>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">{task.id}</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            {task.type} — {task.area} — {task.dept}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canClone && <button className="btn-outline" onClick={handleClone}>Clone</button>}
          {forward.map((a) => (
            <button key={a.id} className="btn-primary" onClick={() => runAction(a)}>
              {a.label}
            </button>
          ))}
          {review.map((a) => (
            <button
              key={a.id}
              className={a.id === "reject" ? "btn-danger" : "btn-secondary"}
              onClick={() => setConfirming(a)}
            >
              {a.label}
            </button>
          ))}
          {terminal.map((a) => (
            <button key={a.id} className="btn-secondary" onClick={() => setConfirming(a)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      {actions.length === 0 && (
        <div className="text-xs" style={{ color: "#6B7280" }}>
          {isExpired
            ? "This task is Expired — a terminal state. It cannot be reopened or transitioned to any other status."
            : `No actions available — ${cap(task.status)} is a final state or your role (${cap(role)}) cannot act on it.`}
        </div>
      )}

      {/* Status flow stepper */}
      <div className="card p-5" style={{ overflowX: "auto" }}>
        <div className="section-label mb-5">Status flow</div>
        <div className="flex items-start" style={{ minWidth: 560 }}>
          {PIPELINE_STAGES.map((stage, i) => {
            const past = !isBranch && i < stageIdx;
            const current = !isBranch && i === stageIdx;
            return (
              <div key={stage} className="flex items-start" style={{ flex: 1 }}>
                <div className="flex flex-col items-center gap-2" style={{ minWidth: 64 }}>
                  <span
                    className={`stepper-dot ${past ? "stepper-done" : current ? "stepper-current" : "stepper-todo"}`}
                    aria-label={`${stage}${current ? " (current)" : past ? " (completed)" : ""}`}
                  >
                    {past ? "✓" : i + 1}
                  </span>
                  <span
                    className="text-center"
                    style={{
                      fontSize: 12,
                      color: current ? "var(--text)" : past ? "#4B5563" : "#9CA3AF",
                      fontWeight: current ? 600 : past ? 500 : 400,
                    }}
                  >
                    {stage}
                  </span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={`stepper-line ${past || current ? "done" : ""}`} style={{ marginTop: 13 }} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-5 pt-4 flex items-center gap-5 flex-wrap" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>Other outcomes:</span>
          {BRANCH_STAGES.map((stage) => {
            const isCurrent = isBranch && stage.toLowerCase() === task.status;
            return (
              <span
                key={stage}
                className="text-xs"
                style={{
                  color: BRANCH_RED.has(stage) ? "#D64545" : "#6B7280",
                  fontWeight: isCurrent ? 700 : 500,
                  textDecoration: isCurrent ? "underline" : "none",
                }}
              >
                {stage}{isCurrent ? " (current)" : ""}
              </span>
            );
          })}
        </div>
      </div>

      {/* Task fields + descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="section-label mb-4">Task information</div>
          <div className="space-y-2.5">
            {[
              ["Task ID",        task.id],
              ["Department",     task.dept],
              ["Area / Unit",    task.area],
              ["Permit type",    task.type],
              ["Submitted",      task.submitted],
              ["Validity start", task.validityStart],
              ["Validity end",   task.validityEnd],
              ["Assigned to",    `${task.assignee} (${task.assigneeRole})`],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <div className="text-xs flex-shrink-0 font-medium" style={{ color: "#6B7280", width: 120 }}>{label}</div>
                <div className="text-xs" style={{ color: "var(--text)" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="section-label mb-2">Description &amp; Work Scope</div>
          <div className="text-sm font-medium text-slate-800">{task.shortDesc}</div>
          {task.details && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="section-label mb-1 text-slate-500">Detailed notes / Scope of work</div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {task.details}
              </p>
            </div>
          )}
        </div>
      </div>


      {/* Remark History + Action History — kept strictly separate:
          remarks are free-text notes only; status changes live in the action log. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Remark History</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>
              {taskRemarks.length} remark{taskRemarks.length !== 1 ? "s" : ""}
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
            Free-text comments and notes only — status changes are recorded under Action History.
          </p>
          <div className="space-y-4 mb-4">
            {taskRemarks.length === 0 && (
              <div className="text-xs" style={{ color: "#9CA3AF" }}>No remarks yet — be the first to comment.</div>
            )}
            {taskRemarks.map((r, i) => (
              <div key={i} className="pl-3" style={{ borderLeft: "2px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{r.user}</span>
                  <span className="badge badge-grey">{r.role}</span>
                </div>
                <p className="text-xs leading-snug mb-1" style={{ color: "#4B5563" }}>{r.text}</p>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>{r.ts}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
            <input
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddRemark(); }}
              placeholder="Add a remark…"
              className="ctrl-input flex-1"
              aria-label="Add a remark"
            />
            <button className="btn-primary" onClick={handleAddRemark} disabled={!remark.trim()}>
              Add
            </button>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Action History</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>
              {taskLogs.length} {taskLogs.length !== 1 ? "entries" : "entry"}
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
            Status changes and actions taken — who did what, and when.
          </p>
          <div className="space-y-3">
            {taskLogs.length === 0 && (
              <div className="text-xs" style={{ color: "#9CA3AF" }}>No recorded actions yet.</div>
            )}
            {taskLogs.map((a, i) => (
              <div key={i} className="flex items-start gap-3 pb-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <span className="badge badge-grey flex-shrink-0">{a.action}</span>
                <div>
                  <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{a.user}</div>
                  {a.from && <div className="text-xs" style={{ color: "#6B7280" }}>{a.from} → {a.to}</div>}
                  {a.detail && (
                    <div className="text-xs mt-0.5 leading-snug" style={{ color: "#4B5563" }}>
                      Reason: {a.detail}
                    </div>
                  )}
                  <div className="text-xs" style={{ color: "#9CA3AF" }}>{a.ts}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Action Dock (< md) ── */}
      {actions.length > 0 && (
        <div className="md:hidden mobile-action-bar flex items-center gap-2">
          {forward.map((a) => (
            <button
              key={a.id}
              className="btn-primary flex-1 py-2.5 text-xs font-bold shadow-sm"
              onClick={() => runAction(a)}
            >
              {a.label}
            </button>
          ))}
          {review.map((a) => (
            <button
              key={a.id}
              className={`flex-1 py-2.5 text-xs font-semibold ${a.id === "reject" ? "btn-danger" : "btn-secondary"}`}
              onClick={() => setConfirming(a)}
            >
              {a.label}
            </button>
          ))}
          {terminal.map((a) => (
            <button key={a.id} className="btn-secondary py-2.5 text-xs px-3" onClick={() => setConfirming(a)}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
