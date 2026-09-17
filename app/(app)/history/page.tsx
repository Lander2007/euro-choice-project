"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { cap, TODAY, useApp } from "../../store/AppStore";

interface FlatEntry {
  taskId: string;
  ts: string;
  user: string;
  action: string;
  from: string | null;
  to: string;
  detail?: string;
}

export default function HistoryPage() {
  const { logs, role } = useApp();
  const [filterUser, setFilterUser] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const allEntries: FlatEntry[] = useMemo(() => {
    const flat: FlatEntry[] = [];
    for (const [taskId, entries] of Object.entries(logs)) {
      for (const e of entries) {
        flat.push({ taskId, ...e });
      }
    }
    // Newest first for an audit-log read.
    return flat.sort((a, b) => b.ts.localeCompare(a.ts));
  }, [logs]);

  const users = useMemo(
    () => [...new Set(allEntries.map((e) => e.user))].sort(),
    [allEntries]
  );
  const actions = useMemo(
    () => [...new Set(allEntries.map((e) => e.action))].sort(),
    [allEntries]
  );

  const filtered = allEntries.filter(
    (e) =>
      (filterUser === "all" || e.user === filterUser) &&
      (filterAction === "all" || e.action === filterAction) &&
      (!filterDate || e.ts.startsWith(filterDate))
  );

  if (role !== "admin") {
    return (
      <div className="space-y-4" style={{ maxWidth: 640 }}>
        <h1 className="page-title">System history</h1>
        <div className="card p-10 text-center">
          <div className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Restricted to administrators
          </div>
          <p className="text-sm mt-1 mb-4" style={{ color: "#6B7280" }}>
            The cross-task audit log is available to the Admin role only. You can
            still review history scoped to each task on its task detail page
            (Remark History and Action History).
          </p>
          <Link href="/tasks">
            <button className="btn-secondary">Back to tasks</button>
          </Link>
        </div>
      </div>
    );
  }

  const hasFilters = filterUser !== "all" || filterAction !== "all" || filterDate !== "";
  const clearFilters = () => {
    setFilterUser("all");
    setFilterAction("all");
    setFilterDate("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">System history</h1>
        <p className="page-subtitle">
          Cross-task audit log — every action across all tasks — {filtered.length} of {allEntries.length} entries shown
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <label className="field-label" htmlFor="hist-user">User</label>
          <select
            id="hist-user"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="ctrl-select"
            style={{ minWidth: 200 }}
          >
            <option value="all">All users</option>
            {users.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="hist-action">Action type</label>
          <select
            id="hist-action"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="ctrl-select"
            style={{ minWidth: 180 }}
          >
            <option value="all">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="hist-date">Date</label>
          <input
            id="hist-date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="ctrl-input"
          />
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost" style={{ paddingBottom: 8 }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Audit log */}
      <div className="table-wrap" style={{ overflowX: "auto" }}>
        <table style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Task</th>
              <th>Action</th>
              <th>User</th>
              <th>Transition</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px" }}>
                  <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    No history entries match your filters
                  </div>
                  <div className="text-xs mt-1" style={{ color: "#6B7280" }}>
                    Try clearing the filters to see the full audit log.
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((e, i) => (
                <tr key={`${e.taskId}-${e.ts}-${i}`}>
                  <td>
                    <span className="text-xs whitespace-nowrap" style={{ color: "#6B7280" }}>{e.ts}</span>
                  </td>
                  <td>
                    <Link href={`/tasks/${e.taskId}`} className="link-action" style={{ fontSize: 12 }}>
                      {e.taskId}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-grey">{e.action}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "var(--text)" }}>{e.user}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "#6B7280" }}>
                      {e.from ? `${e.from} → ${e.to}` : `→ ${e.to}`}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "#4B5563" }}>
                      {e.detail || <span style={{ color: "#9CA3AF" }}>—</span>}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs" style={{ color: "#9CA3AF" }}>
        Read as: “{cap("samir")} rejected task 13 on {TODAY}” — each row names the actor, action, task, and date.
      </div>
    </div>
  );
}
