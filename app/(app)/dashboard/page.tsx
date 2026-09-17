"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import NewTaskModal from "../../components/NewTaskModal";
import { can, cap, pendingForRole, TODAY, TOMORROW, useApp } from "../../store/AppStore";

export default function DashboardPage() {
  const { tasks, certs, role } = useApp();
  const [showNewTask, setShowNewTask] = useState(false);

  // Filter tasks requiring immediate action from current user's role
  const myPendingTasks = useMemo(() => pendingForRole(tasks, role), [tasks, role]);

  const activeWorkOrders = useMemo(
    () => tasks.filter((t) => ["ongoing", "approved", "submitted", "pending", "received"].includes(t.status)),
    [tasks]
  );

  const dueSoonTasks = useMemo(
    () => tasks.filter((t) => t.validityEnd <= TOMORROW && !["closed", "cancelled", "expired"].includes(t.status)),
    [tasks]
  );

  const urgentCerts = useMemo(
    () => certs.filter((c) => c.expiry <= TOMORROW || !c.verified),
    [certs]
  );

  // Critical items queue (pending role action first, then due soon)
  const actionQueue = useMemo(() => {
    const queue = [...myPendingTasks];
    for (const t of dueSoonTasks) {
      if (!queue.some((q) => q.id === t.id)) {
        queue.push(t);
      }
    }
    return queue.slice(0, 6);
  }, [myPendingTasks, dueSoonTasks]);

  const canCreate = can(role, "create");

  return (
    <div className="space-y-6">
      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} />}

      {/* ── Operational Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title text-xl md:text-2xl">Operational Overview</h1>
            <span className="badge badge-yellow">{cap(role)}</span>
          </div>
          <p className="page-subtitle text-xs md:text-sm">
            Refinery Complex Alpha · Shift Date: <span className="font-semibold text-slate-800">{TODAY}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {canCreate && (
            <button
              onClick={() => setShowNewTask(true)}
              className="btn-primary group"
              aria-label="Create new task"
            >
              <svg className="w-3.5 h-3.5 -ml-0.5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Task / Permit</span>
            </button>
          )}
          <Link href="/tasks" className="btn-secondary group">
            <span>Task Register</span>
            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── 3 Clean ERP Metric Tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Tile 1: Awaiting My Role's Action */}
        <div className={`kpi-tile ${myPendingTasks.length > 0 ? "highlight" : ""}`}>
          <div className="flex items-center justify-between">
            <span className="section-label">Awaiting My Action</span>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: myPendingTasks.length > 0 ? "var(--primary)" : "#94A3B8" }}
            />
          </div>
          <div className="my-2">
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              {myPendingTasks.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Requires {cap(role)} review
            </div>
          </div>
          <Link href="/tasks" className="text-xs font-semibold text-amber-700 hover:underline inline-flex items-center gap-1">
            Review queue →
          </Link>
        </div>

        {/* Tile 2: Active Work Orders */}
        <div className="kpi-tile">
          <div className="flex items-center justify-between">
            <span className="section-label">Active Permits</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              {activeWorkOrders.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Active in refinery
            </div>
          </div>
          <span className="text-xs text-slate-500">Across all units</span>
        </div>

        {/* Tile 3: Expiring Soon (< 48h) */}
        <div className={`kpi-tile ${dueSoonTasks.length > 0 ? "danger-highlight" : ""}`}>
          <div className="flex items-center justify-between">
            <span className="section-label">Due &lt; 48 Hours</span>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: dueSoonTasks.length > 0 ? "var(--danger)" : "#94A3B8" }}
            />
          </div>
          <div className="my-2">
            <div
              className="text-2xl md:text-3xl font-extrabold tracking-tight"
              style={{ color: dueSoonTasks.length > 0 ? "var(--danger)" : "var(--text)" }}
            >
              {dueSoonTasks.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Validity expiring soon
            </div>
          </div>
          <span className="text-xs font-medium text-red-600">Urgent renewals</span>
        </div>

        {/* Tile 4: Certificate Compliance — Hidden from UI (retained in code)
        <div className="kpi-tile">
          <div className="flex items-center justify-between">
            <span className="section-label">Certificates</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              {certs.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {urgentCerts.length > 0 ? `${urgentCerts.length} unverified / expiring` : "All verified"}
            </div>
          </div>
          <Link href="/certificates" className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
            Cert registry →
          </Link>
        </div>
        */}
      </div>

      {/* ── Operational Action Queue ── */}
      <div className="card overflow-hidden">
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-200">
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-900">Priority Action Queue</h2>
            <p className="text-xs text-slate-500">Tasks requiring immediate processing or expiring shortly</p>
          </div>
          <Link href="/tasks" className="text-xs font-semibold text-blue-600 hover:underline">
            View full register ({tasks.length}) →
          </Link>
        </div>

        {actionQueue.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            All clear! No tasks currently require your immediate action.
          </div>
        ) : (
          <div>
            {/* Desktop Table View (≥ md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-4">Task ID</th>
                    <th className="py-3 px-4">Area / Unit</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Permit Type</th>
                    <th className="py-3 px-4">Valid Until</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {actionQueue.map((task) => {
                    const isUrgent = task.validityEnd <= TOMORROW;
                    return (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <Link href={`/tasks/${task.id}`} className="text-blue-600 hover:underline">
                            {task.id}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">{task.area}</td>
                        <td className="py-3 px-4 text-slate-500">{task.dept}</td>
                        <td className="py-3 px-4 text-slate-700">{task.type}</td>
                        <td className={`py-3 px-4 font-mono ${isUrgent ? "font-semibold text-red-600" : "text-slate-600"}`}>
                          {task.validityEnd}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/tasks/${task.id}`} className="btn-table-action">
                            <span>Open</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< md) - Ergonomic and Touch Friendly */}
            <div className="md:hidden divide-y divide-slate-100">
              {actionQueue.map((task) => {
                const isUrgent = task.validityEnd <= TOMORROW;
                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors text-inherit"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-blue-600">{task.id}</span>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mb-1">
                      {task.area} <span className="font-normal text-slate-500">· {task.dept}</span>
                    </div>
                    <div className="text-xs text-slate-600 mb-2 truncate">
                      {task.type} — {task.shortDesc}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Assigned: <strong className="text-slate-700">{task.assignee}</strong></span>
                      <span className={isUrgent ? "font-semibold text-red-600 font-mono" : "font-mono"}>
                        Due: {task.validityEnd}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Access Category Chips ── */}
      <div className="card p-4">
        <div className="section-label mb-3">Refinery Quick Filters</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Hot Work Permits", query: "?type=Hot+Work+Permit" },
            { label: "Confined Space Entry", query: "?type=Confined+Space+Entry" },
            { label: "Height Work", query: "?type=Height+Work+Permit" },
            { label: "Maintenance Dept", query: "?dept=Maintenance" },
            { label: "Operations Dept", query: "?dept=Operations" },
          ].map((item) => (
            <Link
              key={item.label}
              href={`/tasks${item.query}`}
              className="text-xs py-1.5 px-3 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
              style={{ textDecoration: "none" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
