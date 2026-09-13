"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/* ── Types ─────────────────────────────────────────────────── */
export type Role = "requester" | "receiver" | "approver" | "admin";

export interface Task {
  id: string;
  area: string;
  dept: string;
  type: string;
  shortDesc: string;
  submitted: string;
  validityStart: string;
  validityEnd: string;
  status: string;
  assignee: string;
  assigneeRole: string;
}

export interface Cert {
  id: string;
  type: string;
  area: string;
  issuer: string;
  issued: string;
  expiry: string;
  status: string;
  taskRef: string;
  verified: boolean;
}

export interface Remark {
  ts: string;
  user: string;
  role: string;
  text: string;
}

export interface LogEntry {
  ts: string;
  user: string;
  action: string;
  from: string | null;
  to: string;
}

export interface Toast {
  id: number;
  message: string;
}

/* ── Demo clock (mock data lives in Dec 2024) ──────────────── */
export const TODAY = "2024-12-13";
export const TOMORROW = "2024-12-14";

export function nowStamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${TODAY} ${hh}:${mm}`;
}

/* ── Permissions (mirrors Roles & Permissions matrix) ──────── */
export const PERMISSIONS: Record<Role, string[]> = {
  requester: ["create", "submit", "clone"],
  receiver: ["receive", "clone", "verify_cert"],
  approver: ["approve", "reject", "return", "verify_cert"],
  admin: [
    "create", "submit", "receive", "approve", "reject", "return",
    "cancel", "clone", "verify_cert", "view_all", "manage_users", "export",
  ],
};

export function can(role: Role, permission: string): boolean {
  return PERMISSIONS[role].includes(permission);
}

/* ── Status machine ────────────────────────────────────────── */
export interface StatusAction {
  id: string;
  label: string;
  to: string;
  permission: string;
  confirm?: string;
  needsReason?: boolean;
}

const ACTION_DEFS: (StatusAction & { from: string[] })[] = [
  { id: "submit",  label: "Submit",     to: "submitted", permission: "submit",  from: ["created", "returned"] },
  { id: "receive", label: "Receive",    to: "received",  permission: "receive", from: ["submitted"] },
  { id: "approve", label: "Approve",    to: "approved",  permission: "approve", from: ["received"] },
  { id: "begin",   label: "Begin work", to: "ongoing",   permission: "receive", from: ["approved"] },
  { id: "close",   label: "Close",      to: "closed",    permission: "approve", from: ["ongoing"], confirm: "Close this task? Closed tasks are read-only." },
  { id: "return",  label: "Return",     to: "returned",  permission: "return",  from: ["submitted", "received"], needsReason: true },
  { id: "reject",  label: "Reject",     to: "rejected",  permission: "reject",  from: ["submitted", "received"], confirm: "Reject this task? This cannot be undone.", needsReason: true },
  { id: "cancel",  label: "Cancel",     to: "cancelled", permission: "cancel",  from: ["created", "submitted", "received", "approved", "returned"], confirm: "Cancel this task? This cannot be undone." },
];

export function allowedActions(status: string, role: Role): StatusAction[] {
  // Legacy seed data uses "pending" for newly arrived requests — treat it
  // as the "submitted" pipeline stage so those tasks stay actionable.
  const stage = status === "pending" ? "submitted" : status;
  return ACTION_DEFS.filter(
    (a) => a.from.includes(stage) && can(role, a.permission)
  ).map(({ from: _from, ...rest }) => rest);
}

export function pendingForRole(tasks: Task[], role: Role): Task[] {
  switch (role) {
    case "requester": return tasks.filter((t) => t.status === "created" || t.status === "returned");
    case "receiver":  return tasks.filter((t) => t.status === "submitted" || t.status === "pending");
    case "approver":  return tasks.filter((t) => t.status === "received");
    case "admin":     return tasks.filter((t) => !["closed", "cancelled", "rejected", "expired"].includes(t.status));
  }
}

/* ── Seed data ─────────────────────────────────────────────── */
const SEED_TASKS: Task[] = [
  { id: "TSK-2024-0847", area: "Unit-3 Reformer",      dept: "Maintenance",  type: "Hot Work Permit",      shortDesc: "Replacement of corroded heat exchanger tubes — E-301A", submitted: "2024-12-09", validityStart: "2024-12-09", validityEnd: "2024-12-16", status: "pending",   assignee: "Ahmed Al-Rashidi",     assigneeRole: "Requester" },
  { id: "TSK-2024-0851", area: "Crude Distillation",    dept: "Operations",   type: "Confined Space Entry", shortDesc: "Vessel entry for tray inspection — C-101",               submitted: "2024-12-10", validityStart: "2024-12-10", validityEnd: "2024-12-17", status: "ongoing",   assignee: "Samir Okafor",          assigneeRole: "Receiver"  },
  { id: "TSK-2024-0839", area: "Hydrogen Plant",         dept: "Safety",       type: "Cold Work Permit",     shortDesc: "Valve gland repacking — H2 header",                      submitted: "2024-12-08", validityStart: "2024-12-08", validityEnd: "2024-12-15", status: "submitted", assignee: "Fatima Al-Zahrawi",     assigneeRole: "Requester" },
  { id: "TSK-2024-0862", area: "Storage Tank Farm",      dept: "Inspection",   type: "Height Work Permit",   shortDesc: "Tank roof seal inspection — TK-204",                     submitted: "2024-12-11", validityStart: "2024-12-11", validityEnd: "2024-12-18", status: "approved",  assignee: "Col. James Harrington", assigneeRole: "Approver"  },
  { id: "TSK-2024-0855", area: "Flare Stack",            dept: "HSE",          type: "Hot Work Permit",      shortDesc: "Pilot burner replacement — FL-01",                       submitted: "2024-12-10", validityStart: "2024-12-10", validityEnd: "2024-12-17", status: "ongoing",   assignee: "Nadia Petrov",          assigneeRole: "Receiver"  },
  { id: "TSK-2024-0831", area: "LPG Sphere Farm",        dept: "Maintenance",  type: "Excavation Permit",    shortDesc: "Underground line exposure — SP-07",                      submitted: "2024-12-07", validityStart: "2024-12-07", validityEnd: "2024-12-14", status: "expired",   assignee: "Omar Khalid",           assigneeRole: "Requester" },
  { id: "TSK-2024-0868", area: "Amine Treating Unit",    dept: "Operations",   type: "Electrical Isolation", shortDesc: "Motor isolation for pump P-312 overhaul",                submitted: "2024-12-12", validityStart: "2024-12-12", validityEnd: "2024-12-13", status: "submitted", assignee: "Ahmed Al-Rashidi",      assigneeRole: "Requester" },
  { id: "TSK-2024-0871", area: "Naphtha Hydrotreater",   dept: "Engineering",  type: "Hot Work Permit",      shortDesc: "Pipe support welding — NHT pipe rack",                   submitted: "2024-12-12", validityStart: "2024-12-12", validityEnd: "2024-12-13", status: "returned",  assignee: "Eng. Layla Mansour",    assigneeRole: "Approver"  },
  { id: "TSK-2024-0875", area: "Cooling Tower",          dept: "Utilities",    type: "Cold Work Permit",     shortDesc: "Fan blade balancing — CT-02",                            submitted: "2024-12-13", validityStart: "2024-12-13", validityEnd: "2024-12-14", status: "approved",  assignee: "Samir Okafor",          assigneeRole: "Receiver"  },
  { id: "TSK-2024-0822", area: "Crude Pipeline",         dept: "Pipeline",     type: "Confined Space Entry", shortDesc: "Valve pit inspection — ML-12",                           submitted: "2024-12-06", validityStart: "2024-12-06", validityEnd: "2024-12-07", status: "closed",    assignee: "Nadia Petrov",          assigneeRole: "Receiver"  },
  { id: "TSK-2024-0879", area: "Diesel Hydrotreater",    dept: "Maintenance",  type: "Hot Work Permit",      shortDesc: "Flange replacement — DHT feed line",                     submitted: "2024-12-13", validityStart: "2024-12-13", validityEnd: "2024-12-14", status: "pending",   assignee: "Fatima Al-Zahrawi",     assigneeRole: "Requester" },
  { id: "TSK-2024-0881", area: "Vacuum Distillation",    dept: "Operations",   type: "Height Work Permit",   shortDesc: "Platform grating replacement — VDU structure",           submitted: "2024-12-13", validityStart: "2024-12-13", validityEnd: "2024-12-14", status: "submitted", assignee: "Omar Khalid",           assigneeRole: "Requester" },
  { id: "TSK-2024-0884", area: "Sulfur Recovery",        dept: "Safety",       type: "Excavation Permit",    shortDesc: "Cable trench digging — SRU substation",                  submitted: "2024-12-13", validityStart: "2024-12-13", validityEnd: "2024-12-14", status: "rejected",  assignee: "Col. James Harrington", assigneeRole: "Approver"  },
  { id: "TSK-2024-0887", area: "Isomerization Unit",     dept: "Engineering",  type: "Electrical Isolation", shortDesc: "Breaker racking for compressor K-401",                   submitted: "2024-12-13", validityStart: "2024-12-13", validityEnd: "2024-12-14", status: "ongoing",   assignee: "Ahmed Al-Rashidi",      assigneeRole: "Requester" },
  { id: "TSK-2024-0890", area: "Product Loading Bay",    dept: "Logistics",    type: "Cold Work Permit",     shortDesc: "Loading arm seal replacement — Bay 4",                  submitted: "2024-12-13", validityStart: "2024-12-13", validityEnd: "2024-12-14", status: "approved",  assignee: "Eng. Layla Mansour",    assigneeRole: "Approver"  },
];

const SEED_CERTS: Cert[] = [
  { id: "GTC-2024-4421", type: "Gas Test Certificate",             area: "Unit-3 Reformer",     issuer: "Hassan Al-Mutairi",  issued: "2024-12-09", expiry: "2024-12-10", status: "expired",   taskRef: "TSK-2024-0847", verified: false },
  { id: "GTC-2024-4430", type: "Gas Test Certificate",             area: "Crude Distillation",  issuer: "Rania Jaber",        issued: "2024-12-12", expiry: "2024-12-13", status: "approved",  taskRef: "TSK-2024-0875", verified: true  },
  { id: "FWA-2024-1183", type: "Fire Watch Authorization",          area: "Unit-3 Reformer",     issuer: "Fire & Safety Dept", issued: "2024-12-09", expiry: "2024-12-16", status: "ongoing",   taskRef: "TSK-2024-0847", verified: true  },
  { id: "FWA-2024-1190", type: "Fire Watch Authorization",          area: "LPG Sphere Farm",     issuer: "Fire & Safety Dept", issued: "2024-12-07", expiry: "2024-12-14", status: "pending",   taskRef: "TSK-2024-0831", verified: false },
  { id: "MIC-2024-0872", type: "Mechanical Isolation Certificate",  area: "Unit-3 Reformer",     issuer: "Samir Okafor",       issued: "2024-12-08", expiry: "2024-12-16", status: "approved",  taskRef: "TSK-2024-0847", verified: true  },
  { id: "MIC-2024-0880", type: "Mechanical Isolation Certificate",  area: "Naphtha Hydrotreater", issuer: "Nadia Petrov",      issued: "2024-12-12", expiry: "2024-12-14", status: "returned",  taskRef: "TSK-2024-0871", verified: false },
  { id: "EIC-2024-0614", type: "Electrical Isolation Certificate",  area: "Amine Treating Unit", issuer: "Yusuf Al-Hamdan",    issued: "2024-12-12", expiry: "2024-12-13", status: "submitted", taskRef: "TSK-2024-0868", verified: false },
  { id: "EIC-2024-0620", type: "Electrical Isolation Certificate",  area: "Isomerization Unit",  issuer: "Yusuf Al-Hamdan",    issued: "2024-12-13", expiry: "2024-12-14", status: "approved",  taskRef: "TSK-2024-0887", verified: true  },
  { id: "GTC-2024-4438", type: "Gas Test Certificate",             area: "Flare Stack",          issuer: "Hassan Al-Mutairi",  issued: "2024-12-10", expiry: "2024-12-17", status: "ongoing",   taskRef: "TSK-2024-0855", verified: true  },
  { id: "FWA-2024-1195", type: "Fire Watch Authorization",          area: "Diesel Hydrotreater", issuer: "Fire & Safety Dept", issued: "2024-12-13", expiry: "2024-12-14", status: "pending",   taskRef: "TSK-2024-0879", verified: false },
  { id: "CWP-2024-2201", type: "Cold Work Pre-Check",               area: "Unit-3 Reformer",     issuer: "Eng. Layla Mansour", issued: "2024-12-09", expiry: "2024-12-16", status: "submitted", taskRef: "TSK-2024-0847", verified: false },
];

const SEED_REMARKS: Record<string, Remark[]> = {
  "TSK-2024-0847": [
    { ts: "2024-12-09 08:14", user: "Ahmed Al-Rashidi",  role: "Requester", text: "Initial submission. All isolation points confirmed with Shift Supervisor. P&ID Rev 7 attached for reference." },
    { ts: "2024-12-09 10:31", user: "Samir Okafor",       role: "Receiver",  text: "Received and logged. Forwarded to Approver queue. Area walkdown scheduled for 14:00." },
    { ts: "2024-12-09 15:45", user: "Eng. Layla Mansour", role: "Approver",  text: "HOLD — Gas test certificate must be less than 4 hours old at time of work start. Please resubmit with gas test certificate dated day-of-work." },
    { ts: "2024-12-10 07:55", user: "Ahmed Al-Rashidi",  role: "Requester", text: "Noted. Gas test cert will be obtained from HSE on day of work. No other changes to scope." },
  ],
};

const SEED_LOGS: Record<string, LogEntry[]> = {
  "TSK-2024-0847": [
    { ts: "2024-12-09 08:14", user: "Ahmed Al-Rashidi",   action: "Created",     from: null,        to: "Created"   },
    { ts: "2024-12-09 08:18", user: "Ahmed Al-Rashidi",   action: "Submitted",   from: "Created",   to: "Submitted" },
    { ts: "2024-12-09 10:31", user: "Samir Okafor",        action: "Received",    from: "Submitted", to: "Received"  },
    { ts: "2024-12-09 15:47", user: "Eng. Layla Mansour",  action: "Returned",    from: "Received",  to: "Returned"  },
    { ts: "2024-12-10 07:57", user: "Ahmed Al-Rashidi",   action: "Resubmitted", from: "Returned",  to: "Submitted" },
  ],
};

function seedLogs(): Record<string, LogEntry[]> {
  const logs: Record<string, LogEntry[]> = { ...SEED_LOGS };
  for (const t of SEED_TASKS) {
    if (!logs[t.id]) {
      logs[t.id] = [
        { ts: `${t.submitted} 08:05`, user: t.assignee, action: "Created",   from: null,      to: "Created" },
        { ts: `${t.submitted} 08:20`, user: t.assignee, action: "Submitted", from: "Created", to: "Submitted" },
      ];
    }
  }
  return logs;
}

/* ── Context ───────────────────────────────────────────────── */
interface AppState {
  user: string;
  role: Role;
  tasks: Task[];
  certs: Cert[];
  remarks: Record<string, Remark[]>;
  logs: Record<string, LogEntry[]>;
  toasts: Toast[];
  login: (user: string, role: Role) => void;
  logout: () => void;
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;
  addTask: (data: Omit<Task, "id" | "status" | "submitted">) => Task;
  cloneTask: (id: string) => Task | null;
  transitionTask: (id: string, action: StatusAction, reason?: string) => void;
  addRemark: (taskId: string, text: string) => void;
  toggleCertVerified: (certId: string) => void;
  verifyCert: (certId: string) => void;
  getTask: (id: string) => Task | undefined;
  certsForTask: (taskId: string) => Cert[];
}

const AppContext = createContext<AppState | null>(null);

function readSession(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
}

let toastSeq = 1;
let taskSeq = 891;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string>(() => readSession("prtcms_user", ""));
  const [role, setRole] = useState<Role>(() => (readSession("prtcms_role", "requester") as Role) || "requester");
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [certs, setCerts] = useState<Cert[]>(SEED_CERTS);
  const [remarks, setRemarks] = useState<Record<string, Remark[]>>(SEED_REMARKS);
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>(seedLogs);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((message: string) => {
    const id = toastSeq++;
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const login = useCallback((nextUser: string, nextRole: Role) => {
    setUser(nextUser);
    setRole(nextRole);
    localStorage.setItem("prtcms_user", nextUser);
    localStorage.setItem("prtcms_role", nextRole);
  }, []);

  const logout = useCallback(() => {
    setUser("");
    localStorage.removeItem("prtcms_user");
    localStorage.removeItem("prtcms_role");
  }, []);

  const appendLog = useCallback((taskId: string, entry: LogEntry) => {
    setLogs((prev) => ({ ...prev, [taskId]: [...(prev[taskId] || []), entry] }));
  }, []);

  const addTask = useCallback((data: Omit<Task, "id" | "status" | "submitted">) => {
    const task: Task = {
      ...data,
      id: `TSK-2024-${String(taskSeq++).padStart(4, "0")}`,
      status: "created",
      submitted: TODAY,
    };
    setTasks((prev) => [task, ...prev]);
    setLogs((prev) => ({
      ...prev,
      [task.id]: [{ ts: nowStamp(), user: data.assignee, action: "Created", from: null, to: "Created" }],
    }));
    return task;
  }, []);

  const cloneTask = useCallback((id: string) => {
    const src = tasks.find((t) => t.id === id);
    if (!src) return null;
    const task: Task = {
      ...src,
      id: `TSK-2024-${String(taskSeq++).padStart(4, "0")}`,
      status: "created",
      submitted: TODAY,
      validityStart: TODAY,
    };
    setTasks((prev) => [task, ...prev]);
    setLogs((prev) => ({
      ...prev,
      [task.id]: [{ ts: nowStamp(), user: src.assignee, action: "Created", from: null, to: "Created" }],
    }));
    return task;
  }, [tasks]);

  const transitionTask = useCallback((id: string, action: StatusAction, reason?: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const fromLabel = cap(task.status);
    const toLabel = cap(action.to);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: action.to } : t)));
    appendLog(id, {
      ts: nowStamp(),
      user,
      action: action.label + (action.id === "submit" && task.status === "returned" ? " (resubmitted)" : ""),
      from: fromLabel,
      to: toLabel,
    });
    if (reason && reason.trim()) {
      setRemarks((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), { ts: nowStamp(), user, role: cap(role), text: `${action.label}: ${reason.trim()}` }],
      }));
    }
  }, [tasks, user, role, appendLog]);

  const addRemark = useCallback((taskId: string, text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setRemarks((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), { ts: nowStamp(), user, role: cap(role), text: clean }],
    }));
  }, [user, role]);

  const verifyCert = useCallback((certId: string) => {
    setCerts((prev) => prev.map((c) => (c.id === certId ? { ...c, verified: true, status: "approved" } : c)));
  }, []);

  const toggleCertVerified = useCallback((certId: string) => {
    setCerts((prev) =>
      prev.map((c) =>
        c.id === certId
          ? { ...c, verified: !c.verified, status: !c.verified ? "approved" : "submitted" }
          : c
      )
    );
  }, []);

  const getTask = useCallback((id: string) => tasks.find((t) => t.id === id), [tasks]);

  const certsForTask = useCallback((taskId: string) => certs.filter((c) => c.taskRef === taskId), [certs]);

  const value = useMemo<AppState>(() => ({
    user, role, tasks, certs, remarks, logs, toasts,
    login, logout, pushToast, dismissToast,
    addTask, cloneTask, transitionTask, addRemark,
    toggleCertVerified, verifyCert, getTask, certsForTask,
  }), [user, role, tasks, certs, remarks, logs, toasts, login, logout, pushToast, dismissToast, addTask, cloneTask, transitionTask, addRemark, toggleCertVerified, verifyCert, getTask, certsForTask]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default AppProvider;
