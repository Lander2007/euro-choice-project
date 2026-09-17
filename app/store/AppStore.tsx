"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/* ── Types ─────────────────────────────────────────────────── */
export type Role = "requester" | "receiver" | "approver" | "admin";

export interface Task {
  id: string;
  area: string;
  dept: string;
  type: string;
  shortDesc: string;
  details?: string;
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
  /** Optional reason/note recorded with the action (e.g. return/reject reason). Shown in Action History only. */
  detail?: string;
}

export interface Toast {
  id: number;
  message: string;
}

/* ── Real-world clock ────────────────────────────────────────
   TODAY/TOMORROW are derived from the device clock at load time.
   Seed dates below are written as rel("<frozen date>"), which keeps
   each record's original offset from the old demo clock (2024-12-13)
   but rebased onto today — so overdue / due-tomorrow behaviour stays
   correct no matter when the app is opened. */
const ANCHOR = "2024-12-13"; // original demo-clock date; seed offsets measured from here

function isoDay(d: Date): string {
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return isoDay(dt);
}

function diffDaysISO(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const a = new Date(fy, fm - 1, fd);
  const b = new Date(ty, tm - 1, td);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export const TODAY = isoDay(new Date());
export const TOMORROW = addDaysISO(TODAY, 1);

/** Rebase a frozen "YYYY-MM-DD" seed date onto the real today, preserving its offset from ANCHOR. */
function rel(seedDate: string): string {
  return addDaysISO(TODAY, diffDaysISO(ANCHOR, seedDate));
}

/** Same as rel(), but preserves the "YYYY-MM-DD HH:MM" log timestamp shape. */
function relTs(seedTs: string): string {
  return rel(seedTs.slice(0, 10)) + seedTs.slice(10);
}

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
  // Business rule: Expired is a terminal state — it cannot be reopened
  // or transitioned to any other status.
  if (status === "expired") return [];
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
  { id: "1", area: "Unit-3 Reformer",      dept: "Maintenance",  type: "Hot Work Permit",      shortDesc: "Replacement of corroded heat exchanger tubes — E-301A", submitted: rel("2024-12-09"), validityStart: rel("2024-12-09"), validityEnd: rel("2024-12-16"), status: "pending",   assignee: "Ahmed Al-Rashidi",     assigneeRole: "Requester" },
  { id: "2", area: "Crude Distillation",    dept: "Operations",   type: "Confined Space Entry", shortDesc: "Vessel entry for tray inspection — C-101",               submitted: rel("2024-12-10"), validityStart: rel("2024-12-10"), validityEnd: rel("2024-12-17"), status: "ongoing",   assignee: "Samir Okafor",          assigneeRole: "Receiver"  },
  { id: "3", area: "Hydrogen Plant",         dept: "Safety",       type: "Cold Work Permit",     shortDesc: "Valve gland repacking — H2 header",                      submitted: rel("2024-12-08"), validityStart: rel("2024-12-08"), validityEnd: rel("2024-12-15"), status: "submitted", assignee: "Fatima Al-Zahrawi",     assigneeRole: "Requester" },
  { id: "4", area: "Storage Tank Farm",      dept: "Inspection",   type: "Height Work Permit",   shortDesc: "Tank roof seal inspection — TK-204",                     submitted: rel("2024-12-11"), validityStart: rel("2024-12-11"), validityEnd: rel("2024-12-18"), status: "approved",  assignee: "Col. James Harrington", assigneeRole: "Approver"  },
  { id: "5", area: "Flare Stack",            dept: "HSE",          type: "Hot Work Permit",      shortDesc: "Pilot burner replacement — FL-01",                       submitted: rel("2024-12-10"), validityStart: rel("2024-12-10"), validityEnd: rel("2024-12-17"), status: "ongoing",   assignee: "Nadia Petrov",          assigneeRole: "Receiver"  },
  { id: "6", area: "LPG Sphere Farm",        dept: "Maintenance",  type: "Excavation Permit",    shortDesc: "Underground line exposure — SP-07",                      submitted: rel("2024-12-07"), validityStart: rel("2024-12-07"), validityEnd: rel("2024-12-14"), status: "expired",   assignee: "Omar Khalid",           assigneeRole: "Requester" },
  { id: "7", area: "Amine Treating Unit",    dept: "Operations",   type: "Electrical Isolation", shortDesc: "Motor isolation for pump P-312 overhaul",                submitted: rel("2024-12-12"), validityStart: rel("2024-12-12"), validityEnd: rel("2024-12-13"), status: "submitted", assignee: "Ahmed Al-Rashidi",      assigneeRole: "Requester" },
  { id: "8", area: "Naphtha Hydrotreater",   dept: "Engineering",  type: "Hot Work Permit",      shortDesc: "Pipe support welding — NHT pipe rack",                   submitted: rel("2024-12-12"), validityStart: rel("2024-12-12"), validityEnd: rel("2024-12-13"), status: "returned",  assignee: "Eng. Layla Mansour",    assigneeRole: "Approver"  },
  { id: "9", area: "Cooling Tower",          dept: "Utilities",    type: "Cold Work Permit",     shortDesc: "Fan blade balancing — CT-02",                            submitted: rel("2024-12-13"), validityStart: rel("2024-12-13"), validityEnd: rel("2024-12-14"), status: "approved",  assignee: "Samir Okafor",          assigneeRole: "Receiver"  },
  { id: "10", area: "Crude Pipeline",         dept: "Pipeline",     type: "Confined Space Entry", shortDesc: "Valve pit inspection — ML-12",                           submitted: rel("2024-12-06"), validityStart: rel("2024-12-06"), validityEnd: rel("2024-12-07"), status: "closed",    assignee: "Nadia Petrov",          assigneeRole: "Receiver"  },
  { id: "11", area: "Diesel Hydrotreater",    dept: "Maintenance",  type: "Hot Work Permit",      shortDesc: "Flange replacement — DHT feed line",                     submitted: rel("2024-12-13"), validityStart: rel("2024-12-13"), validityEnd: rel("2024-12-14"), status: "pending",   assignee: "Fatima Al-Zahrawi",     assigneeRole: "Requester" },
  { id: "12", area: "Vacuum Distillation",    dept: "Operations",   type: "Height Work Permit",   shortDesc: "Platform grating replacement — VDU structure",           submitted: rel("2024-12-13"), validityStart: rel("2024-12-13"), validityEnd: rel("2024-12-14"), status: "submitted", assignee: "Omar Khalid",           assigneeRole: "Requester" },
  { id: "13", area: "Sulfur Recovery",        dept: "Safety",       type: "Excavation Permit",    shortDesc: "Cable trench digging — SRU substation",                  submitted: rel("2024-12-13"), validityStart: rel("2024-12-13"), validityEnd: rel("2024-12-14"), status: "rejected",  assignee: "Col. James Harrington", assigneeRole: "Approver"  },
  { id: "14", area: "Isomerization Unit",     dept: "Engineering",  type: "Electrical Isolation", shortDesc: "Breaker racking for compressor K-401",                   submitted: rel("2024-12-13"), validityStart: rel("2024-12-13"), validityEnd: rel("2024-12-14"), status: "ongoing",   assignee: "Ahmed Al-Rashidi",      assigneeRole: "Requester" },
  { id: "15", area: "Product Loading Bay",    dept: "Logistics",    type: "Cold Work Permit",     shortDesc: "Loading arm seal replacement — Bay 4",                  submitted: rel("2024-12-13"), validityStart: rel("2024-12-13"), validityEnd: rel("2024-12-14"), status: "approved",  assignee: "Eng. Layla Mansour",    assigneeRole: "Approver"  },
];

const SEED_CERTS: Cert[] = [
  { id: "1", type: "Gas Test Certificate",             area: "Unit-3 Reformer",     issuer: "Hassan Al-Mutairi",  issued: rel("2024-12-09"), expiry: rel("2024-12-10"), status: "expired",   taskRef: "1", verified: false },
  { id: "2", type: "Gas Test Certificate",             area: "Crude Distillation",  issuer: "Rania Jaber",        issued: rel("2024-12-12"), expiry: rel("2024-12-13"), status: "approved",  taskRef: "9", verified: true  },
  { id: "3", type: "Fire Watch Authorization",          area: "Unit-3 Reformer",     issuer: "Fire & Safety Dept", issued: rel("2024-12-09"), expiry: rel("2024-12-16"), status: "ongoing",   taskRef: "1", verified: true  },
  { id: "4", type: "Fire Watch Authorization",          area: "LPG Sphere Farm",     issuer: "Fire & Safety Dept", issued: rel("2024-12-07"), expiry: rel("2024-12-14"), status: "pending",   taskRef: "6", verified: false },
  { id: "5", type: "Mechanical Isolation Certificate",  area: "Unit-3 Reformer",     issuer: "Samir Okafor",       issued: rel("2024-12-08"), expiry: rel("2024-12-16"), status: "approved",  taskRef: "1", verified: true  },
  { id: "6", type: "Mechanical Isolation Certificate",  area: "Naphtha Hydrotreater", issuer: "Nadia Petrov",      issued: rel("2024-12-12"), expiry: rel("2024-12-14"), status: "returned",  taskRef: "8", verified: false },
  { id: "7", type: "Electrical Isolation Certificate",  area: "Amine Treating Unit", issuer: "Yusuf Al-Hamdan",    issued: rel("2024-12-12"), expiry: rel("2024-12-13"), status: "submitted", taskRef: "7", verified: false },
  { id: "8", type: "Electrical Isolation Certificate",  area: "Isomerization Unit",  issuer: "Yusuf Al-Hamdan",    issued: rel("2024-12-13"), expiry: rel("2024-12-14"), status: "approved",  taskRef: "14", verified: true  },
  { id: "9", type: "Gas Test Certificate",             area: "Flare Stack",          issuer: "Hassan Al-Mutairi",  issued: rel("2024-12-10"), expiry: rel("2024-12-17"), status: "ongoing",   taskRef: "5", verified: true  },
  { id: "10", type: "Fire Watch Authorization",          area: "Diesel Hydrotreater", issuer: "Fire & Safety Dept", issued: rel("2024-12-13"), expiry: rel("2024-12-14"), status: "pending",   taskRef: "11", verified: false },
  { id: "11", type: "Cold Work Pre-Check",               area: "Unit-3 Reformer",     issuer: "Eng. Layla Mansour", issued: rel("2024-12-09"), expiry: rel("2024-12-16"), status: "submitted", taskRef: "1", verified: false },
];

const SEED_REMARKS: Record<string, Remark[]> = {
  "1": [
    { ts: relTs("2024-12-09 08:14"), user: "Ahmed Al-Rashidi",  role: "Requester", text: "Initial submission. All isolation points confirmed with Shift Supervisor. P&ID Rev 7 attached for reference." },
    { ts: relTs("2024-12-09 10:31"), user: "Samir Okafor",       role: "Receiver",  text: "Received and logged. Forwarded to Approver queue. Area walkdown scheduled for 14:00." },
    { ts: relTs("2024-12-09 15:45"), user: "Eng. Layla Mansour", role: "Approver",  text: "HOLD — Gas test certificate must be less than 4 hours old at time of work start. Please resubmit with gas test certificate dated day-of-work." },
    { ts: relTs("2024-12-10 07:55"), user: "Ahmed Al-Rashidi",  role: "Requester", text: "Noted. Gas test cert will be obtained from HSE on day of work. No other changes to scope." },
  ],
};

const SEED_LOGS: Record<string, LogEntry[]> = {
  "1": [
    { ts: relTs("2024-12-09 08:14"), user: "Ahmed Al-Rashidi",   action: "Created",     from: null,        to: "Created"   },
    { ts: relTs("2024-12-09 08:18"), user: "Ahmed Al-Rashidi",   action: "Submitted",   from: "Created",   to: "Submitted" },
    { ts: relTs("2024-12-09 10:31"), user: "Samir Okafor",        action: "Received",    from: "Submitted", to: "Received"  },
    { ts: relTs("2024-12-09 15:47"), user: "Eng. Layla Mansour",  action: "Returned",    from: "Received",  to: "Returned", detail: "Gas test certificate must be less than 4 hours old at time of work start." },
    { ts: relTs("2024-12-10 07:57"), user: "Ahmed Al-Rashidi",   action: "Submitted", from: "Returned",  to: "Submitted" },
  ],
  "13": [
    { ts: relTs("2024-12-13 08:05"), user: "Omar Khalid",           action: "Created",   from: null,        to: "Created"   },
    { ts: relTs("2024-12-13 08:20"), user: "Omar Khalid",           action: "Submitted", from: "Created",   to: "Submitted" },
    { ts: relTs("2024-12-13 11:02"), user: "Samir Okafor",          action: "Received",  from: "Submitted", to: "Received"  },
    { ts: relTs("2024-12-13 13:40"), user: "Samir Okafor",          action: "Rejected",  from: "Received",  to: "Rejected", detail: "Cable route crosses live instrument loop — reroute required." },
  ],
  "8": [
    { ts: relTs("2024-12-12 08:05"), user: "Eng. Layla Mansour", action: "Created",   from: null,        to: "Created"   },
    { ts: relTs("2024-12-12 08:20"), user: "Eng. Layla Mansour", action: "Submitted", from: "Created",   to: "Submitted" },
    { ts: relTs("2024-12-12 10:12"), user: "Samir Okafor",       action: "Received",  from: "Submitted", to: "Received"  },
    { ts: relTs("2024-12-12 14:55"), user: "Eng. Layla Mansour", action: "Returned",  from: "Received",  to: "Returned", detail: "Missing single-line diagram for breaker K-401." },
  ],
  "4": [
    { ts: relTs("2024-12-11 08:05"), user: "Col. James Harrington", action: "Created",   from: null,        to: "Created"   },
    { ts: relTs("2024-12-11 08:20"), user: "Col. James Harrington", action: "Submitted", from: "Created",   to: "Submitted" },
    { ts: relTs("2024-12-11 09:44"), user: "Samir Okafor",          action: "Received",  from: "Submitted", to: "Received"  },
    { ts: relTs("2024-12-12 09:15"), user: "Col. James Harrington", action: "Approved",  from: "Received",  to: "Approved"  },
  ],
  "7": [
    { ts: relTs("2024-12-12 08:05"), user: "Ahmed Al-Rashidi", action: "Created",   from: null,      to: "Created" },
    { ts: relTs("2024-12-12 08:20"), user: "Ahmed Al-Rashidi", action: "Submitted", from: "Created", to: "Submitted" },
    { ts: relTs("2024-12-12 12:30"), user: "Samir Okafor",     action: "Received",  from: "Submitted", to: "Received" },
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
  ready: boolean;
  tasks: Task[];
  certs: Cert[];
  remarks: Record<string, Remark[]>;
  logs: Record<string, LogEntry[]>;
  toasts: Toast[];
  login: (user: string, role: Role) => void;
  logout: () => void;
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;
  addTask: (data: Omit<Task, "id" | "status" | "submitted"> & { id?: string }) => Task;
  cloneTask: (id: string) => Task | null;
  peekNextTaskId: () => string;
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
let taskSeq = 16;

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Fallback-only initial state so the first client render matches the
  // server prerender. The real session is hydrated in the effect below —
  // reading localStorage during render would cause hydration mismatches.
  const [user, setUser] = useState<string>("");
  const [role, setRole] = useState<Role>("requester");
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [certs, setCerts] = useState<Cert[]>(SEED_CERTS);
  const [remarks, setRemarks] = useState<Record<string, Remark[]>>(SEED_REMARKS);
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>(seedLogs);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setUser(readSession("prtcms_user", ""));
    const stored = readSession("prtcms_role", "requester") as Role;
    setRole(PERMISSIONS[stored] ? stored : "requester");
    setReady(true);
  }, []);

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

  const addTask = useCallback((data: Omit<Task, "id" | "status" | "submitted"> & { id?: string }) => {
    // Paper-workflow parity: the operator types the Task ID manually.
    // Fall back to the sequence only when the field is left blank.
    const manualId = data.id?.trim();
    const task: Task = {
      ...data,
      id: manualId || String(taskSeq++),
      status: "created",
      submitted: TODAY,
    };
    // Keep the auto-sequence ahead of any manually entered numeric suffix
    // so future auto IDs never collide (e.g. operator types 42).
    if (manualId) {
      const m = manualId.match(/(\d+)\s*$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n >= taskSeq) taskSeq = n + 1;
      }
    }
    setTasks((prev) => [task, ...prev]);
    setLogs((prev) => ({
      ...prev,
      [task.id]: [{ ts: nowStamp(), user: data.assignee, action: "Created", from: null, to: "Created" }],
    }));
    return task;
  }, []);

  const cloneTask = useCallback((id: string) => {    const src = tasks.find((t) => t.id === id);
    if (!src) return null;
    const task: Task = {
      ...src,
      id: String(taskSeq++),
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

  const peekNextTaskId = useCallback(() => {
    return String(taskSeq);
  }, []);

  const transitionTask = useCallback((id: string, action: StatusAction, reason?: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    // Business rule: Expired is terminal — no transitions allowed.
    if (task.status === "expired") return;
    const fromLabel = cap(task.status);
    const toLabel = cap(action.to);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: action.to } : t)));
    const cleanReason = reason?.trim();
    appendLog(id, {
      ts: nowStamp(),
      user,
      action: action.label + (action.id === "submit" && task.status === "returned" ? " (resubmitted)" : ""),
      from: fromLabel,
      to: toLabel,
      ...(cleanReason ? { detail: cleanReason } : {}),
    });
  }, [tasks, user, appendLog]);

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
    user, role, ready, tasks, certs, remarks, logs, toasts,
    login, logout, pushToast, dismissToast,
    addTask, cloneTask, peekNextTaskId, transitionTask, addRemark,
    toggleCertVerified, verifyCert, getTask, certsForTask,
  }), [user, role, ready, tasks, certs, remarks, logs, toasts, login, logout, pushToast, dismissToast, addTask, cloneTask, peekNextTaskId, transitionTask, addRemark, toggleCertVerified, verifyCert, getTask, certsForTask]);

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
