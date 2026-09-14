"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import NewTaskModal from "../../components/NewTaskModal";
import { can, pendingForRole, TOMORROW, useApp } from "../../store/AppStore";

type View = "all" | "pending" | "tomorrow";

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <div className="rounded" style={{ height: 14, background: "var(--border-soft)" }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function TasksPage() {
  const { tasks, role, cloneTask, pushToast } = useApp();
  const [search,       setSearch]       = useState("");
  const [filterDept,   setFilterDept]   = useState("all");
  const [filterType,   setFilterType]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [view,         setView]         = useState<View>("all");
  const [sortAlpha,    setSortAlpha]    = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const DEPTS    = useMemo(() => [...new Set(tasks.map((t) => t.dept))], [tasks]);
  const TYPES    = useMemo(() => [...new Set(tasks.map((t) => t.type))], [tasks]);
  const STATUSES = useMemo(() => [...new Set(tasks.map((t) => t.status))], [tasks]);

  // Visibility rule: EVERY authenticated user sees the full register.
  // "All tasks" is never scoped by role or assignee — only the ability to
  // act (submit/receive/approve/…) is gated by role + current status.
  // "My pending actions" is an opt-in tab, never the default.
  let filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    return (
      (!q || t.id.toLowerCase().includes(q) || t.area.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q)) &&
      (filterDept   === "all" || t.dept   === filterDept) &&
      (filterType   === "all" || t.type   === filterType) &&
      (filterStatus === "all" || t.status === filterStatus)
    );
  });

  if (view === "pending") {
    const pendingIds = new Set(pendingForRole(tasks, role).map((t) => t.id));
    filtered = filtered.filter((t) => pendingIds.has(t.id));
  }
  if (view === "tomorrow") {
    // Due tomorrow or already overdue, most urgent first
    filtered = filtered
      .filter((t) => t.validityEnd <= TOMORROW && !["closed", "cancelled"].includes(t.status))
      .sort((a, b) => {
        if (sortAlpha) return a.area.localeCompare(b.area);
        const urg = (s: string) => (["expired", "rejected"].includes(s) ? 0 : 1);
        return urg(a.status) - urg(b.status) || a.validityEnd.localeCompare(b.validityEnd);
      });
  }

  const VIEWS: { key: View; label: string }[] = [
    { key: "all",      label: "All tasks" },
    { key: "pending",  label: "My pending actions" },
    { key: "tomorrow", label: "Planning tomorrow" },
  ];

  const handleClone = (id: string) => {
    const task = cloneTask(id);
    if (task) pushToast(`Task cloned as ${task.id}`);
  };

  const canCreate = can(role, "create");
  const canClone = can(role, "clone");

  return (
    <div className="space-y-5">
      {showNew && <NewTaskModal onClose={() => setShowNew(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Tasks &amp; job register</h1>
          <p className="page-subtitle">
            Permit-to-work management — {filtered.length} record{filtered.length !== 1 ? "s" : ""} shown
            {" · "}all tasks visible to every role (read-only unless your role can act)
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowNew(true)}
          disabled={!canCreate}
          title={canCreate ? "Create a new task" : `Your role (${role}) cannot create tasks`}
        >
          + New task
        </button>
      </div>

      {/* View tabs */}
      <div className="flex items-center flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`tab-btn ${view === key ? "active" : ""}`}
            aria-pressed={view === key}
          >
            {label}
          </button>
        ))}
        {view === "tomorrow" && (
          <button
            onClick={() => setSortAlpha((a) => !a)}
            aria-pressed={sortAlpha}
            className="btn-secondary ml-auto"
            style={{ fontSize: 13, padding: "6px 12px", marginBottom: 8 }}
          >
            Sort A–Z {sortAlpha ? "on" : "off"}
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, area, operator…"
          className="ctrl-input flex-1"
          style={{ minWidth: 200 }}
          aria-label="Search tasks"
        />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="ctrl-select" aria-label="Filter by department">
          <option value="all">All departments</option>
          {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="ctrl-select" aria-label="Filter by type">
          <option value="all">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="ctrl-select" aria-label="Filter by status">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ overflowX: "auto" }}>
        <table style={{ minWidth: 960 }}>
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Task ID</th>
              <th>Area / Unit</th>
              <th>Department</th>
              <th>Permit type</th>
              <th>Submitted</th>
              <th>Valid until</th>
              <th>Status</th>
              <th>Assigned to</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={10} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "48px 16px" }}>
                  <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>No tasks match your filters</div>
                  <div className="text-xs mt-1" style={{ color: "#6B7280" }}>Try clearing the search or choosing different filters.</div>
                </td>
              </tr>
            ) : (
              filtered.map((task, idx) => (
                <tr key={task.id}>
                  <td>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>
                      {String(idx + 1).padStart(3, "0")}
                    </span>
                  </td>
                  <td>
                    <Link href={`/tasks/${task.id}`} className="link-action">
                      {task.id}
                    </Link>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: "var(--text)" }}>{task.area}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{task.dept}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "var(--text)" }}>{task.type}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{task.submitted}</span>
                  </td>
                  <td>
                    <span
                      className="text-xs"
                      style={{
                        color: task.validityEnd <= TOMORROW ? "#D64545" : "var(--text)",
                        fontWeight: task.validityEnd <= TOMORROW ? 600 : 400,
                      }}
                    >
                      {task.validityEnd}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={task.status} />
                  </td>
                  <td>
                    <div className="text-xs" style={{ color: "var(--text)" }}>{task.assignee}</div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>{task.assigneeRole}</div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link href={`/tasks/${task.id}`}>
                        <button className="btn-ghost">View</button>
                      </Link>
                      {canClone && (
                        <button
                          className="btn-outline"
                          style={{ fontSize: 12, padding: "5px 10px" }}
                          onClick={() => handleClone(task.id)}
                        >
                          Clone
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
