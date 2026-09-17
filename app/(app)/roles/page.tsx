"use client";
import { useApp } from "../../store/AppStore";

const ROLES = ["Requester", "Receiver", "Approver", "Admin"];

const ALL_ACTIONS = [
  { id: "create",       label: "Create Task",         desc: "Open a new permit-to-work request",           category: "Workflow" },
  { id: "submit",       label: "Submit",              desc: "Forward request to the receiver queue",       category: "Workflow" },
  { id: "receive",      label: "Receive",             desc: "Log and process an incoming task submission", category: "Workflow" },
  { id: "approve",      label: "Approve",             desc: "Grant final work authorisation",              category: "Workflow" },
  { id: "reject",       label: "Reject",              desc: "Deny a request with a stated reason",         category: "Workflow" },
  { id: "return",       label: "Return",              desc: "Send back to requester for correction",       category: "Workflow" },
  { id: "cancel",       label: "Cancel",              desc: "Void and close a task record",                category: "Workflow" },
  { id: "clone",        label: "Clone Task",          desc: "Duplicate an existing task record",           category: "Data"     },
  { id: "verify_cert",  label: "Verify Certificate",  desc: "Manually mark a certificate as verified",    category: "Data"     },
  { id: "view_all",     label: "View All Tasks",      desc: "Access the full task register",               category: "Access"   },
  { id: "manage_users", label: "Manage Users",        desc: "Create, edit, and assign user accounts",     category: "Access"   },
  { id: "export",       label: "Export Data",         desc: "Download reports and data extracts",          category: "Access"   },
];

// Certificates action hidden from UI display (retained in code without deleting)
const ACTIONS = ALL_ACTIONS.filter((a) => a.id !== "verify_cert");

const PERMISSIONS: Record<string, string[]> = {
  Requester: ["create", "submit", "clone"],
  Receiver:  ["receive", "clone", "verify_cert"],
  Approver:  ["approve", "reject", "return", "verify_cert"],
  Admin:     ["create", "submit", "receive", "approve", "reject", "return", "cancel", "clone", "verify_cert", "view_all", "manage_users", "export"],
};

const CATEGORIES = ["Workflow", "Data", "Access"];

const ROLE_DESC: Record<string, string> = {
  Requester: "Field operators who raise and submit PTW requests",
  Receiver:  "Control-room staff who receive and route incoming tasks",
  Approver:  "Senior engineers / supervisors who authorise work",
  Admin:     "System administrators with unrestricted access",
};

export default function RolesPage() {
  const { role: activeRole } = useApp();
  return (
    <div className="space-y-6" style={{ maxWidth: 1024 }}>

      {/* Header */}
      <div>
        <h1 className="page-title">Roles &amp; permissions matrix</h1>
        <p className="page-subtitle">
          Access control — system authorisation matrix — 4 roles × {ACTIONS.length} permissions
        </p>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLES.map((role) => {
          const count = ACTIONS.filter((a) => PERMISSIONS[role]?.includes(a.id)).length;
          const pct   = Math.round((count / ACTIONS.length) * 100);
          const isCurrent = role.toLowerCase() === activeRole;
          return (
            <div
              key={role}
              className="card p-5"
              style={isCurrent ? { borderColor: "#E8B923", borderWidth: 2 } : undefined}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{role}</div>
                {isCurrent && <span className="badge badge-yellow">Current role</span>}
              </div>
              <p className="text-xs leading-snug mt-1 mb-3" style={{ color: "#6B7280" }}>{ROLE_DESC[role]}</p>
              <div className="text-xs font-medium" style={{ color: "var(--text)" }}>
                {count} of {ACTIONS.length} permissions
              </div>
              <div className="mt-2 rounded-full" style={{ height: 6, background: "var(--border-soft)" }}>
                <div className="rounded-full" style={{ height: 6, width: `${pct}%`, background: "#E8B923" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions matrix table */}
      <div>
        <div className="section-label mb-3">Detailed permission matrix</div>

        <div className="table-wrap" style={{ overflowX: "auto" }}>
          <table style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Action</th>
                <th style={{ textAlign: "center" }}>Category</th>
                {ROLES.map((r) => (
                  <th key={r} style={{ textAlign: "center" }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                catActions(cat).map((action) => (
                  <tr key={action.id}>
                    <td>
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{action.label}</div>
                      <div className="text-xs" style={{ color: "#6B7280" }}>{action.desc}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-grey">{action.category}</span>
                    </td>
                    {ROLES.map((role) => {
                      const allowed = PERMISSIONS[role].includes(action.id);
                      return (
                        <td key={role} style={{ textAlign: "center" }}>
                          <span
                            className="text-xs font-medium"
                            style={{ color: allowed ? "var(--text)" : "#D1D5DB" }}
                          >
                            {allowed ? "Yes" : "No"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 pt-1">
        <span className="text-xs font-medium" style={{ color: "var(--text)" }}>Yes — permitted</span>
        <span className="text-xs" style={{ color: "#9CA3AF" }}>No — not permitted</span>
        <span className="text-xs" style={{ color: "#9CA3AF" }}>
          Admin has all permissions by default
        </span>
      </div>
    </div>
  );
}

function catActions(cat: string) {
  return ACTIONS.filter((a) => a.category === cat);
}
