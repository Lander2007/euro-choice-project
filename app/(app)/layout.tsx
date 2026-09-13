"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { path: "/dashboard",    label: "Dashboard",          code: "DSH" },
  { path: "/tasks",        label: "Tasks & Jobs",        code: "TSK" },
  { path: "/certificates", label: "Certificates",        code: "CRT" },
  { path: "/roles",        label: "Roles & Permissions", code: "RLS" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    setUser(localStorage.getItem("prtcms_user") || "Unknown Operator");
    setRole(localStorage.getItem("prtcms_role") || "requester");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("prtcms_user");
    localStorage.removeItem("prtcms_role");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F3ECDA" }}>

      {/* ── Header nameplate ─────────────────────────────────────── */}
      <header className="nameplate" style={{ position: "sticky", top: 0, zIndex: 40 }}>
        <div className="flex items-center justify-between px-6 py-3">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="rivet" />
            <div className="rivet" />
            <div className="ml-2">
              <div
                className="font-stencil font-bold"
                style={{ color: "#E3B23C", fontSize: 18, letterSpacing: "0.1em" }}
              >
                PRTCMS
              </div>
              <div className="font-mono" style={{ color: "#6E6A5E", fontSize: 10 }}>
                Petroleum Refinery Task &amp; Certificate Management
              </div>
            </div>
            <div
              style={{
                width: 1,
                height: 32,
                background: "#3A3530",
                marginLeft: 12,
                marginRight: 4,
              }}
            />
            <div className="flex items-center gap-1.5 ml-1">
              <div className="led led-green" />
              <span className="font-mono" style={{ color: "#6E6A5E", fontSize: 11 }}>System Online</span>
            </div>
          </div>

          {/* Operator info */}
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="font-sans text-sm font-medium" style={{ color: "#F3ECDA" }}>
                {user}
              </div>
              <div className="font-stencil text-xs" style={{ color: "#E3B23C" }}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{
                borderColor: "#3A3530",
                color: "#9A9589",
                fontSize: 11,
                padding: "6px 12px",
              }}
            >
              Sign Out
            </button>
            <div className="rivet" />
            <div className="rivet" />
          </div>
        </div>
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent 0%, #E3B23C 30%, #E3B23C 70%, transparent 100%)" }} />
      </header>

      <div className="flex flex-1" style={{ minHeight: 0 }}>

        {/* ── Left sidebar ─────────────────────────────────────────── */}
        <aside
          style={{
            width: 210,
            minWidth: 210,
            background: "#1A1710",
            borderRight: "1px solid #2E2B26",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Panel label */}
          <div
            className="px-4 py-3 font-stencil text-xs"
            style={{
              color: "#4A4640",
              borderBottom: "1px solid #2E2B26",
              letterSpacing: "0.1em",
            }}
          >
            Navigation
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.path ||
                pathname.startsWith(item.path + "/");
              return (
                <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
                  <div className={`nav-item ${isActive ? "active" : ""}`}>
                    {/* Status dot */}
                    <div
                      className={`led ${isActive ? "led-yellow" : "led-grey"}`}
                      style={{ width: 8, height: 8 }}
                    />
                    <div>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: 10,
                          color: isActive ? "#E3B23C" : "#4A4640",
                          lineHeight: 1,
                          marginBottom: 2,
                        }}
                      >
                        {item.code}
                      </div>
                      <div
                        className="font-sans text-sm font-medium"
                        style={{ color: isActive ? "#F3ECDA" : "#9A9589" }}
                      >
                        {item.label}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderTop: "1px solid #2E2B26" }}
          >
            <div className="led led-green" style={{ width: 7, height: 7 }} />
            <span className="font-mono" style={{ color: "#3A3530", fontSize: 10 }}>
              PWR — ON
            </span>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-auto"
          style={{ padding: "28px 32px" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
