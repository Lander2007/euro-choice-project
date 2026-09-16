"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cap, useApp, type Role } from "../store/AppStore";

const ALL_NAV = [
  { path: "/dashboard",    label: "Dashboard",       roles: ["requester", "receiver", "approver", "admin"] as Role[] },
  { path: "/tasks",        label: "Tasks & Permits", roles: ["requester", "receiver", "approver", "admin"] as Role[] },
  { path: "/history",      label: "Audit History",   roles: ["admin"] as Role[] },
  { path: "/roles",        label: "Roles & Access",  roles: ["approver", "admin"] as Role[] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, role, logout, ready } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setDrawerOpen((o) => !o);
    } else {
      setSidebarOpen((o) => !o);
    }
  };

  const navItems = ALL_NAV.filter((n) => n.roles.includes(role));

  const nav = (
    <nav className="flex-1 space-y-0.5">
      {navItems.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
        return (
          <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
            <div className={`nav-item ${isActive ? "active" : ""}`}>
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* ── Top bar ── */}
      <header
        className="chrome flex items-center justify-between px-4 md:px-6 py-2.5"
        style={{ borderBottom: "1px solid var(--chrome-border)", position: "sticky", top: 0, zIndex: 40 }}
      >
        <div className="flex items-center gap-3">
          <button
            className="btn-ghost p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex items-center justify-center cursor-pointer"
            onClick={handleToggleSidebar}
            aria-label="Toggle navigation sidebar"
            aria-expanded={sidebarOpen}
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <div>
              <div className="text-sm font-bold tracking-tight" style={{ color: "#FFFFFF" }}>PRTCMS ERP</div>
              <div className="text-[11px] hidden sm:block leading-none" style={{ color: "var(--chrome-muted)" }}>
                Refinery Operations &amp; Permits
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <div className="text-right">
            <div className="text-xs md:text-sm font-medium" style={{ color: "#FFFFFF" }}>{user || "…"}</div>
            <div className="text-[11px] leading-none" style={{ color: "var(--chrome-muted)" }}>{cap(role)}</div>
          </div>
          <span className="badge badge-yellow hidden sm:inline-flex">{cap(role)}</span>
          <button onClick={handleLogout} className="btn-secondary text-xs">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1" style={{ minHeight: 0 }}>

        {/* ── Sidebar (desktop) ── */}
        <aside
          className="chrome hidden md:flex flex-col transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0"
          style={{
            width: sidebarOpen ? 220 : 0,
            minWidth: sidebarOpen ? 220 : 0,
            borderRight: sidebarOpen ? "1px solid var(--chrome-border)" : "none",
            padding: sidebarOpen ? "16px 10px" : "16px 0",
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? "auto" : "none",
          }}
          aria-hidden={!sidebarOpen}
        >
          <div style={{ width: 200, minWidth: 200 }} className="flex flex-col flex-1">
            {nav}
            <div
              className="text-[11px] px-3 pt-3 flex items-center justify-between"
              style={{ color: "var(--chrome-muted)", borderTop: "1px solid var(--chrome-border)" }}
            >
              <span>Industrial ERP v2.5</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Drawer (mobile/tablet) ── */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label="Navigation">
            <div
              className="absolute inset-0"
              style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(2px)" }}
              onClick={() => setDrawerOpen(false)}
            />
            <aside
              className="chrome absolute left-0 top-0 bottom-0 flex flex-col"
              style={{ width: 260, padding: "16px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
            >
              <div className="flex items-center justify-between px-2 mb-4">
                <span className="text-sm font-bold" style={{ color: "#FFFFFF" }}>Navigation</span>
                <button
                  className="btn-ghost p-1 text-slate-400 hover:text-white"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {nav}
              <div className="mt-auto pt-4 border-t border-slate-700">
                <button
                  onClick={handleLogout}
                  className="w-full btn-danger"
                  style={{ fontSize: 13, padding: "8px 12px" }}
                >
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 overflow-auto pb-20 md:pb-6" style={{ padding: "20px clamp(14px, 3vw, 28px)" }}>
          <div style={{ width: "100%", maxWidth: "100%", margin: 0 }}>{children}</div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar (formal text tabs) ── */}
      <nav className="bottom-nav md:hidden" aria-label="Mobile Bottom Navigation">
        <Link
          href="/dashboard"
          className={`bottom-nav-item ${pathname === "/dashboard" ? "active" : ""}`}
        >
          <span>Overview</span>
        </Link>
        <Link
          href="/tasks"
          className={`bottom-nav-item ${pathname.startsWith("/tasks") ? "active" : ""}`}
        >
          <span>Tasks</span>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="bottom-nav-item bg-transparent border-none cursor-pointer"
          aria-label="Open menu"
        >
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}

