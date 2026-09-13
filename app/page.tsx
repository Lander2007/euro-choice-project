"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { id: "requester", label: "Requester", code: "REQ", desc: "Submit and track permit-to-work requests" },
  { id: "receiver",  label: "Receiver",  code: "RCV", desc: "Receive and process incoming task submissions" },
  { id: "approver",  label: "Approver",  code: "APR", desc: "Review, approve, return, or reject tasks" },
  { id: "admin",     label: "Administrator", code: "ADM", desc: "Full system access and user management" },
];

const DEMO_USERS: Record<string, { name: string; badge: string }[]> = {
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
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const canEnter = !!selectedRole && !!selectedUser;

  const handleEnter = () => {
    if (!canEnter) return;
    localStorage.setItem("prtcms_role", selectedRole!);
    localStorage.setItem("prtcms_user", selectedUser!);
    router.push("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#F3ECDA" }}
    >
      {/* ── Top nameplate header ── */}
      <header className="nameplate">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="rivet" />
            <div className="rivet" />
            <div className="ml-2">
              <div className="font-stencil text-xl font-bold" style={{ color: "#E3B23C", letterSpacing: "0.1em" }}>
                PRTCMS
              </div>
              <div className="font-mono text-xs" style={{ color: "#6E6A5E" }}>
                PETROLEUM REFINERY TASK &amp; CERTIFICATE MANAGEMENT SYSTEM
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 pr-2">
            <div className="flex items-center gap-2">
              <div className="led led-green" />
              <span className="font-mono text-xs" style={{ color: "#6E6A5E" }}>System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="led led-yellow" />
              <span className="font-mono text-xs" style={{ color: "#6E6A5E" }}>Proto v2.4</span>
            </div>
            <div className="rivet" />
            <div className="rivet" />
          </div>
        </div>
        {/* Bottom accent line */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent 0%, #E3B23C 30%, #E3B23C 70%, transparent 100%)" }} />
      </header>

      {/* ── Login body ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">

          {/* Title block */}
          <div className="mb-8 text-center">
            <div className="font-stencil text-3xl font-bold mb-1" style={{ color: "#1E1B16" }}>
              Access Control
            </div>
            <div className="font-sans text-sm" style={{ color: "#6E6A5E" }}>
              Select your role and operator ID to continue. This is a demonstration prototype.
            </div>
          </div>

          {/* Step 1 — Role */}
          <div className="mb-6">
            <div
              className="font-stencil text-xs mb-3 flex items-center gap-2"
              style={{ color: "#6E6A5E" }}
            >
              <span
                className="inline-flex items-center justify-center font-mono text-xs font-bold"
                style={{
                  width: 20, height: 20,
                  background: selectedRole ? "#E3B23C" : "#D4CCB8",
                  color: selectedRole ? "#1E1B16" : "#9A9589",
                  borderRadius: 2,
                }}
              >1</span>
              Select Role
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => {
                const active = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => { setSelectedRole(role.id); setSelectedUser(null); }}
                    className="text-left p-4 rounded-sm transition-all duration-100"
                    style={{
                      background: active ? "#1E1B16" : "#FAF7F0",
                      border: `2px solid ${active ? "#E3B23C" : "#D4CCB8"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`led ${active ? "led-yellow" : "led-grey"}`} />
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: active ? "#E3B23C" : "#9A9589" }}
                      >
                        {role.code}
                      </span>
                    </div>
                    <div
                      className="font-stencil text-sm font-semibold"
                      style={{ color: active ? "#F3ECDA" : "#1E1B16" }}
                    >
                      {role.label}
                    </div>
                    <div
                      className="font-sans text-xs mt-1 leading-snug"
                      style={{ color: active ? "#9A9589" : "#6E6A5E" }}
                    >
                      {role.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Operator (only shown after role selection) */}
          {selectedRole && (
            <div className="mb-6">
              <div
                className="font-stencil text-xs mb-3 flex items-center gap-2"
                style={{ color: "#6E6A5E" }}
              >
                <span
                  className="inline-flex items-center justify-center font-mono text-xs font-bold"
                  style={{
                    width: 20, height: 20,
                    background: selectedUser ? "#E3B23C" : "#D4CCB8",
                    color: selectedUser ? "#1E1B16" : "#9A9589",
                    borderRadius: 2,
                  }}
                >2</span>
                Select Operator ID
              </div>
              <div className="space-y-1.5">
                {DEMO_USERS[selectedRole]?.map((user) => {
                  const active = selectedUser === user.name;
                  return (
                    <button
                      key={user.badge}
                      onClick={() => setSelectedUser(user.name)}
                      className="w-full text-left px-4 py-3 rounded-sm flex items-center gap-4 transition-all duration-100"
                      style={{
                        background: active ? "#1E1B16" : "#FAF7F0",
                        border: `1.5px solid ${active ? "#E3B23C" : "#D4CCB8"}`,
                      }}
                    >
                      <div className={`led ${active ? "led-green" : "led-grey"}`} />
                      <div>
                        <div
                          className="font-sans text-sm font-medium"
                          style={{ color: active ? "#F3ECDA" : "#1E1B16" }}
                        >
                          {user.name}
                        </div>
                        <div className="font-mono text-xs" style={{ color: "#9A9589" }}>
                          {user.badge}
                        </div>
                      </div>
                      {active && (
                        <div className="ml-auto font-stencil text-xs" style={{ color: "#E3B23C" }}>
                          Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Enter button */}
          <button
            onClick={handleEnter}
            disabled={!canEnter}
            className="btn-primary w-full py-3.5 text-sm"
          >
            {canEnter ? "Enter System" : "Select Role and Operator to Continue"}
          </button>

          {/* Footer note */}
          <p
            className="mt-5 text-center font-mono text-xs"
            style={{ color: "#B4ACAA" }}
          >
            Demonstration prototype — no real authentication — static mock data only
          </p>
        </div>
      </div>
    </div>
  );
}
