"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, type Role } from "./store/AppStore";

const ROLES: { id: Role; label: string; desc: string }[] = [
  { id: "requester", label: "Requester", desc: "Submit and track permit-to-work requests" },
  { id: "receiver",  label: "Receiver",  desc: "Receive and process incoming task submissions" },
  { id: "approver",  label: "Approver",  desc: "Review, approve, return, or reject tasks" },
  { id: "admin",     label: "Administrator", desc: "Full system access and user management" },
];

const DEMO_USERS: Record<Role, { name: string; badge: string }[]> = {
  requester: [
    { name: "Ahmed Al-Rashidi",   badge: "REQ-001" },
    { name: "Fatima Al-Zahrawi", badge: "REQ-002" },
    { name: "Omar Khalid",        badge: "REQ-003" },
  ],
  receiver: [
    { name: "Samir Okafor", badge: "RCV-001" },
    { name: "Nadia Petrov", badge: "RCV-002" },
  ],
  approver: [
    { name: "Col. James Harrington", badge: "APR-001" },
    { name: "Eng. Layla Mansour",    badge: "APR-002" },
  ],
  admin: [
    { name: "System Administrator", badge: "ADM-001" },
  ],
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const canEnter = !!selectedRole && !!selectedUser;

  const handleEnter = () => {
    if (!canEnter || !selectedRole || !selectedUser) return;
    login(selectedUser, selectedRole);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header className="chrome flex items-center justify-between px-8 py-4" style={{ borderBottom: "1px solid var(--chrome-border)" }}>
        <div>
          <div className="text-lg font-bold" style={{ color: "#FFFFFF" }}>PRTCMS</div>
          <div className="text-xs" style={{ color: "var(--chrome-muted)" }}>
            Petroleum Refinery Task &amp; Certificate Management System
          </div>
        </div>
        <span className="badge badge-grey">Demonstration prototype</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="card w-full p-8" style={{ maxWidth: 560 }}>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Sign in</h1>
          <p className="text-sm mt-1 mb-6" style={{ color: "#6B7280" }}>
            Select your role and operator ID to continue. Permissions and pending work adapt to the selected role.
          </p>

          <div className="mb-6">
            <label className="field-label">1. Select role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => {
                const active = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => { setSelectedRole(role.id); setSelectedUser(null); }}
                    aria-pressed={active}
                    className="text-left p-4 transition-all"
                    style={{
                      background: active ? "#FDF3D3" : "var(--surface)",
                      border: `1px solid ${active ? "#E8B923" : "var(--border)"}`,
                      borderRadius: 8,
                    }}
                  >
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {role.label}
                    </div>
                    <div className="text-xs mt-1 leading-snug" style={{ color: "#6B7280" }}>
                      {role.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedRole && (
            <div className="mb-6">
              <label className="field-label">2. Select operator ID</label>
              <div className="space-y-2">
                {DEMO_USERS[selectedRole]?.map((user) => {
                  const active = selectedUser === user.name;
                  return (
                    <button
                      key={user.badge}
                      onClick={() => setSelectedUser(user.name)}
                      aria-pressed={active}
                      className="w-full text-left px-4 py-3 flex items-center gap-4 transition-all"
                      style={{
                        background: active ? "#E8F0FE" : "var(--surface)",
                        border: `1px solid ${active ? "#3B82F6" : "var(--border)"}`,
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                          {user.name}
                        </div>
                        <div className="text-xs" style={{ color: "#6B7280" }}>
                          {user.badge}
                        </div>
                      </div>
                      {active && (
                        <div className="ml-auto text-xs font-semibold" style={{ color: "#1D5FD0" }}>
                          Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleEnter}
            disabled={!canEnter}
            className="btn-primary w-full py-3 text-sm"
          >
            {canEnter ? "Enter System" : "Select role and operator to continue"}
          </button>

          <p className="mt-4 text-center text-xs" style={{ color: "#9CA3AF" }}>
            Demonstration prototype — no real authentication — static mock data only
          </p>
        </div>
      </div>
    </div>
  );
}
