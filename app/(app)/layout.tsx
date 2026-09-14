"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cap, useApp, type Role } from "../store/AppStore";

const ALL_NAV = [
  { path: "/dashboard",    label: "Dashboard",           roles: ["requester", "receiver", "approver", "admin"] as Role[] },
  { path: "/tasks",        label: "Tasks & Jobs",        roles: ["requester", "receiver", "approver", "admin"] as Role[] },
  { path: "/certificates", label: "Certificates",        roles: ["receiver", "approver", "admin"] as Role[] },
  { path: "/history",      label: "History",             roles: ["admin"] as Role[] },
  { path: "/roles",        label: "Roles & Permissions", roles: ["approver", "admin"] as Role[] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, role, logout, ready } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.push("/");
  }, [ready, user, router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navItems = ALL_NAV.filter((n) => n.roles.includes(role));

  const nav = (
    <nav className="flex-1">
      {navItems.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
        return (
          <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
            <div className={`nav-item ${isActive ? "active" : ""}`}>{item.label}</div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* ── Top bar ── */}
      <header
        className="chrome flex items-center justify-between px-4 md:px-6 py-3"
        style={{ borderBottom: "1px solid var(--chrome-border)", position: "sticky", top: 0, zIndex: 40 }}
      >
        <div className="flex items-center gap-3">
          <button
            className="btn-ghost md:hidden"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label="Toggle navigation"
            aria-expanded={drawerOpen}
            style={{ fontSize: 20, lineHeight: 1, color: "#E5E5E5" }}
          >
            ☰
          </button>
          <div>
            <div className="text-base font-bold" style={{ color: "#FFFFFF" }}>PRTCMS</div>
            <div className="text-xs hidden sm:block" style={{ color: "var(--chrome-muted)" }}>
              Petroleum Refinery Task &amp; Certificate Management
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="text-right">
            <div className="text-sm font-medium" style={{ color: "#FFFFFF" }}>{user || "…"}</div>
            <div className="text-xs" style={{ color: "var(--chrome-muted)" }}>{cap(role)}</div>
          </div>
          <span className="badge badge-yellow hidden sm:inline-flex">{cap(role)}</span>
          <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: 13, padding: "7px 14px" }}>
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1" style={{ minHeight: 0 }}>

        {/* ── Sidebar (desktop) ── */}
        <aside
          className="chrome hidden md:flex"
          style={{
            width: 232,
            minWidth: 232,
            borderRight: "1px solid var(--chrome-border)",
            flexDirection: "column",
            padding: "16px 12px",
          }}
        >
          {nav}
          <div className="text-xs px-3 pt-3" style={{ color: "var(--chrome-muted)", borderTop: "1px solid var(--chrome-border)" }}>
            PRTCMS v2.4
          </div>
        </aside>

        {/* ── Drawer (mobile/tablet) ── */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label="Navigation">
            <div
              className="absolute inset-0"
              style={{ background: "rgba(17, 24, 39, 0.45)" }}
              onClick={() => setDrawerOpen(false)}
            />
            <aside
              className="chrome absolute left-0 top-0 bottom-0 flex flex-col"
              style={{ width: 248, padding: "16px 12px", boxShadow: "0 8px 32px rgba(17,24,39,0.2)" }}
            >
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-sm font-bold" style={{ color: "#FFFFFF" }}>Menu</span>
                <button className="btn-ghost" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" style={{ fontSize: 18, color: "#E5E5E5" }}>×</button>
              </div>
              {nav}
            </aside>
          </div>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 overflow-auto" style={{ padding: "24px clamp(16px, 4vw, 32px)" }}>
          <div style={{ maxWidth: 1200 }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
