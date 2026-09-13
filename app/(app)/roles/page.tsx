const ROLES = ["Requester", "Receiver", "Approver", "Admin"];

const ACTIONS = [
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
  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="font-stencil text-2xl font-bold" style={{ color: "#1E1B16" }}>
          Roles &amp; Permissions Matrix
        </h1>
        <p className="font-mono text-xs mt-1" style={{ color: "#9A9589" }}>
          Access control — system authorisation matrix — 4 roles × 12 permissions
        </p>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {ROLES.map((role) => {
          const count   = PERMISSIONS[role].length;
          const isAdmin = role === "Admin";
          return (
            <div key={role} className="eng-panel rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`led ${isAdmin ? "led-yellow" : "led-green"}`} />
                <div className="font-stencil text-sm font-semibold" style={{ color: "#1E1B16" }}>{role}</div>
              </div>
              <p className="font-sans text-xs leading-snug mb-3" style={{ color: "#6E6A5E" }}>{ROLE_DESC[role]}</p>
              <div className="font-mono text-xs" style={{ color: "#9A9589" }}>
                {count} of {ACTIONS.length} permissions
              </div>
              {/* Mini permission dots */}
              <div className="flex flex-wrap gap-1 mt-2">
                {ACTIONS.map((a) => (
                  <div
                    key={a.id}
                    className={`led ${PERMISSIONS[role].includes(a.id) ? "led-green" : "led-grey"}`}
                    style={{ width: 7, height: 7 }}
                    title={a.label}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions matrix table */}
      <div>
        <div
          className="font-stencil text-xs mb-3"
          style={{ color: "#9A9589", borderBottom: "1px solid #D4CCB8", paddingBottom: 6, letterSpacing: "0.1em" }}
        >
          Detailed Permission Matrix
        </div>

        <div className="table-wrap blueprint-bg">
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Action</th>
                <th style={{ textAlign: "center" }}>Category</th>
                {ROLES.map((r) => (
                  <th key={r} style={{ textAlign: "center" }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => {
                const catActions = ACTIONS.filter((a) => a.category === cat);
                return catActions.map((action, i) => (
                  <tr key={action.id} style={{ borderTop: i === 0 ? "2px solid #D4CCB8" : undefined }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div className="font-stencil text-xs" style={{ color: "#1E1B16", fontSize: 11 }}>{action.label}</div>
                      <div className="font-sans text-xs" style={{ color: "#9A9589", fontSize: 10 }}>{action.desc}</div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span
                        className="font-stencil text-xs px-2 py-0.5 rounded-sm"
                        style={{ background: "#EDE5CE", color: "#6E6A5E", fontSize: 9 }}
                      >
                        {action.category}
                      </span>
                    </td>
                    {ROLES.map((role) => {
                      const allowed = PERMISSIONS[role].includes(action.id);
                      return (
                        <td key={role} style={{ padding: "10px 14px", textAlign: "center" }}>
                          <div className="flex items-center justify-center gap-1.5">
                            <div className={`led ${allowed ? "led-green" : "led-grey"}`} />
                            <span
                              className="font-mono text-xs"
                              style={{ color: allowed ? "#2E8018" : "#C4BAA0", fontSize: 9 }}
                            >
                              {allowed ? "Yes" : "No"}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-8 pt-1">
        {[
          { cls: "led-green", label: "Permitted" },
          { cls: "led-grey",  label: "Not permitted" },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`led ${cls}`} />
            <span className="font-sans text-xs" style={{ color: "#6E6A5E" }}>{label}</span>
          </div>
        ))}
        <span className="font-mono text-xs" style={{ color: "#B4ACAA" }}>
          Admin has all permissions by default
        </span>
      </div>
    </div>
  );
}
