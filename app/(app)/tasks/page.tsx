"use client";
import { useState } from "react";
import Link from "next/link";

const MOCK_TASKS = [
  { id: "TSK-2024-0847", area: "Unit-3 Reformer",      dept: "Maintenance",  type: "Hot Work Permit",        submitted: "2024-12-09", validityEnd: "2024-12-16", status: "pending",   assignee: "Ahmed Al-Rashidi",      role: "Requester" },
  { id: "TSK-2024-0851", area: "Crude Distillation",    dept: "Operations",   type: "Confined Space Entry",   submitted: "2024-12-10", validityEnd: "2024-12-17", status: "ongoing",   assignee: "Samir Okafor",           role: "Receiver"  },
  { id: "TSK-2024-0839", area: "Hydrogen Plant",         dept: "Safety",       type: "Cold Work Permit",       submitted: "2024-12-08", validityEnd: "2024-12-15", status: "submitted", assignee: "Fatima Al-Zahrawi",      role: "Requester" },
  { id: "TSK-2024-0862", area: "Storage Tank Farm",      dept: "Inspection",   type: "Height Work Permit",     submitted: "2024-12-11", validityEnd: "2024-12-18", status: "approved",  assignee: "Col. James Harrington",  role: "Approver"  },
  { id: "TSK-2024-0855", area: "Flare Stack",            dept: "HSE",          type: "Hot Work Permit",        submitted: "2024-12-10", validityEnd: "2024-12-17", status: "ongoing",   assignee: "Nadia Petrov",           role: "Receiver"  },
  { id: "TSK-2024-0831", area: "LPG Sphere Farm",        dept: "Maintenance",  type: "Excavation Permit",      submitted: "2024-12-07", validityEnd: "2024-12-14", status: "expired",   assignee: "Omar Khalid",            role: "Requester" },
  { id: "TSK-2024-0868", area: "Amine Treating Unit",    dept: "Operations",   type: "Electrical Isolation",   submitted: "2024-12-12", validityEnd: "2024-12-13", status: "submitted", assignee: "Ahmed Al-Rashidi",       role: "Requester" },
  { id: "TSK-2024-0871", area: "Naphtha Hydrotreater",   dept: "Engineering",  type: "Hot Work Permit",        submitted: "2024-12-12", validityEnd: "2024-12-13", status: "returned",  assignee: "Eng. Layla Mansour",     role: "Approver"  },
  { id: "TSK-2024-0875", area: "Cooling Tower",          dept: "Utilities",    type: "Cold Work Permit",       submitted: "2024-12-13", validityEnd: "2024-12-14", status: "approved",  assignee: "Samir Okafor",           role: "Receiver"  },
  { id: "TSK-2024-0822", area: "Crude Pipeline",         dept: "Pipeline",     type: "Confined Space Entry",   submitted: "2024-12-06", validityEnd: "2024-12-07", status: "closed",    assignee: "Nadia Petrov",           role: "Receiver"  },
  { id: "TSK-2024-0879", area: "Diesel Hydrotreater",    dept: "Maintenance",  type: "Hot Work Permit",        submitted: "2024-12-13", validityEnd: "2024-12-14", status: "pending",   assignee: "Fatima Al-Zahrawi",      role: "Requester" },
  { id: "TSK-2024-0881", area: "Vacuum Distillation",    dept: "Operations",   type: "Height Work Permit",     submitted: "2024-12-13", validityEnd: "2024-12-14", status: "submitted", assignee: "Omar Khalid",            role: "Requester" },
  { id: "TSK-2024-0884", area: "Sulfur Recovery",        dept: "Safety",       type: "Excavation Permit",      submitted: "2024-12-13", validityEnd: "2024-12-14", status: "rejected",  assignee: "Col. James Harrington",  role: "Approver"  },
  { id: "TSK-2024-0887", area: "Isomerization Unit",     dept: "Engineering",  type: "Electrical Isolation",   submitted: "2024-12-13", validityEnd: "2024-12-14", status: "ongoing",   assignee: "Ahmed Al-Rashidi",       role: "Requester" },
  { id: "TSK-2024-0890", area: "Product Loading Bay",    dept: "Logistics",    type: "Cold Work Permit",       submitted: "2024-12-13", validityEnd: "2024-12-14", status: "approved",  assignee: "Eng. Layla Mansour",     role: "Approver"  },
];

const STATUS_LED: Record<string, string> = {
  approved: "led-green", ongoing:   "led-green",  submitted: "led-yellow",
  pending:  "led-yellow", expired:  "led-red",    rejected:  "led-red",
  returned: "led-amber",  closed:   "led-grey",   cancelled: "led-grey",
};

const STATUS_LABEL: Record<string, string> = {
  approved: "Approved", ongoing: "Ongoing", submitted: "Submitted",
  pending: "Pending", expired: "Expired", rejected: "Rejected",
  returned: "Returned", closed: "Closed", cancelled: "Cancelled",
};

const DEPTS    = [...new Set(MOCK_TASKS.map((t) => t.dept))];
const TYPES    = [...new Set(MOCK_TASKS.map((t) => t.type))];
const STATUSES = [...new Set(MOCK_TASKS.map((t) => t.status))];

type View = "all" | "pending" | "tomorrow";

export default function TasksPage() {
  const [search,       setSearch]       = useState("");
  const [filterDept,   setFilterDept]   = useState("all");
  const [filterType,   setFilterType]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [view,         setView]         = useState<View>("all");
  const [sortAlpha,    setSortAlpha]    = useState(false);

  let tasks = MOCK_TASKS.filter((t) => {
    const q = search.toLowerCase();
    return (
      (!q || t.id.toLowerCase().includes(q) || t.area.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q)) &&
      (filterDept   === "all" || t.dept   === filterDept) &&
      (filterType   === "all" || t.type   === filterType) &&
      (filterStatus === "all" || t.status === filterStatus)
    );
  });

  if (view === "pending") tasks = tasks.filter((t) => t.status === "pending" || t.status === "submitted");
  if (view === "tomorrow") {
    tasks = tasks.filter((t) => t.validityEnd === "2024-12-14");
    tasks = [...tasks].sort((a, b) =>
      sortAlpha
        ? a.area.localeCompare(b.area)
        : a.validityEnd.localeCompare(b.validityEnd)
    );
  }

  const VIEWS: { key: View; label: string }[] = [
    { key: "all",      label: "All Tasks"         },
    { key: "pending",  label: "My Pending Actions" },
    { key: "tomorrow", label: "Planning Tomorrow"  },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-stencil text-2xl font-bold" style={{ color: "#1E1B16" }}>
            Tasks &amp; Job Register
          </h1>
          <p className="font-mono text-xs mt-1" style={{ color: "#9A9589" }}>
            Permit-to-Work management — {tasks.length} record{tasks.length !== 1 ? "s" : ""} shown
          </p>
        </div>
        <button className="btn-primary text-sm">+ New Task</button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1.5">
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className="font-stencil text-xs px-4 py-2 rounded-sm border transition-all"
            style={{
              background:   view === key ? "#1E1B16"   : "#FAF7F0",
              color:        view === key ? "#E3B23C"   : "#6E6A5E",
              borderColor:  view === key ? "#3A3530"   : "#D4CCB8",
            }}
          >
            {label}
          </button>
        ))}
        {view === "tomorrow" && (
          <button
            onClick={() => setSortAlpha((a) => !a)}
            className="ml-auto font-stencil text-xs px-3 py-2 rounded-sm border"
            style={{
              borderColor: sortAlpha ? "#E3B23C" : "#D4CCB8",
              color:       sortAlpha ? "#C49020" : "#9A9589",
              background:  "#FAF7F0",
            }}
          >
            A–Z {sortAlpha ? "▼" : "○"}
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, area, operator…"
          className="ctrl-input flex-1 min-w-48"
        />
        <select value={filterDept}   onChange={(e) => setFilterDept(e.target.value)}   className="ctrl-select">
          <option value="all">All Departments</option>
          {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterType}   onChange={(e) => setFilterType(e.target.value)}   className="ctrl-select">
          <option value="all">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="ctrl-select">
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap blueprint-bg">
        <table>
          <thead>
            <tr>
              <th style={{ width: 44 }}>#</th>
              <th>Task ID</th>
              <th>Area / Unit</th>
              <th>Department</th>
              <th>Permit Type</th>
              <th>Submitted</th>
              <th>Valid Until</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "#9A9589" }}>
                  <div className="font-stencil text-sm">No records match current filters</div>
                </td>
              </tr>
            ) : (
              tasks.map((task, idx) => (
                <tr key={task.id}>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-mono text-xs" style={{ color: "#B4ACAA" }}>
                      {String(idx + 1).padStart(3, "0")}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Link href={`/tasks/${task.id}`}>
                      <span className="font-mono text-xs font-bold" style={{ color: "#1E1B16", textDecoration: "underline", textDecorationColor: "#D4CCB8" }}>
                        {task.id}
                      </span>
                    </Link>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-sans text-sm" style={{ color: "#1E1B16" }}>{task.area}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-sans text-xs" style={{ color: "#6E6A5E" }}>{task.dept}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-mono text-xs" style={{ color: "#1E1B16" }}>{task.type}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="font-mono text-xs" style={{ color: "#6E6A5E" }}>{task.submitted}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span
                      className="font-mono text-xs"
                      style={{ color: task.validityEnd <= "2024-12-14" ? "#C1402A" : "#1E1B16", fontWeight: task.validityEnd <= "2024-12-14" ? 600 : 400 }}
                    >
                      {task.validityEnd}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div className="flex items-center gap-2">
                      <div className={`led ${STATUS_LED[task.status]}`} />
                      <span className="font-sans text-xs" style={{ color: "#6E6A5E" }}>
                        {STATUS_LABEL[task.status]}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div className="font-sans text-xs" style={{ color: "#1E1B16" }}>{task.assignee}</div>
                    <div className="font-mono text-xs" style={{ color: "#9A9589" }}>{task.role}</div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div className="flex gap-1.5">
                      <Link href={`/tasks/${task.id}`}>
                        <button className="btn-ghost" style={{ fontSize: 10, padding: "4px 8px" }}>View</button>
                      </Link>
                      <button className="btn-ghost" style={{ fontSize: 10, padding: "4px 8px", color: "#C49020", borderColor: "#D4CCB8" }}>
                        Clone
                      </button>
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
