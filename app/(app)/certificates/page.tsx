"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import { can, cap, useApp, type Cert } from "../../store/AppStore";

const CERT_TYPES = [
  "Gas Test Certificate",
  "Fire Watch Authorization",
  "Mechanical Isolation Certificate",
  "Electrical Isolation Certificate",
];

function VerifyModal({ cert, onClose }: { cert: Cert; onClose: () => void }) {
  const { verifyCert, pushToast } = useApp();
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(17, 24, 39, 0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Manual verification"
    >
      <div
        className="w-full mx-4 p-6"
        style={{ maxWidth: 480, background: "var(--surface)", borderRadius: 8, boxShadow: "0 12px 40px rgba(17,24,39,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Manual verification
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: 18, lineHeight: 1 }} aria-label="Close">×</button>
        </div>

        <div className="rounded-md p-4 mb-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="space-y-2">
            {[
              ["Certificate no.", cert.id],
              ["Type",            cert.type],
              ["Area / Unit",     cert.area],
              ["Issuing authority", cert.issuer],
              ["Date issued",     cert.issued],
              ["Expiry date",     cert.expiry],
              ["Linked task",     cert.taskRef],
              ["Current status",  cap(cert.status)],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <div className="text-xs flex-shrink-0 font-medium" style={{ color: "#6B7280", width: 130 }}>{label}</div>
                <div className="text-xs" style={{ color: "var(--text)" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs leading-relaxed mb-5" style={{ color: "#6B7280" }}>
          By marking this certificate as verified, you confirm that you have reviewed the physical documentation and all data fields are correct. This action is recorded in the audit log and reflected on the linked task ({cert.taskRef}).
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => { verifyCert(cert.id); pushToast(`${cert.id} marked as verified`); onClose(); }}
            className="btn-primary flex-1"
          >
            Mark as verified
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const { certs, role } = useApp();
  const [filterType,  setFilterType]  = useState("all");
  const [selectedCert, setSelected]  = useState<Cert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const filtered = filterType === "all" ? certs : certs.filter((c) => c.type === filterType);
  const canVerify = can(role, "verify_cert");

  return (
    <div className="space-y-5">
      {selectedCert && (
        <VerifyModal cert={selectedCert} onClose={() => setSelected(null)} />
      )}

      <div>
        <h1 className="page-title">Certificate registry</h1>
        <p className="page-subtitle">
          Permit documentation — {filtered.length} record{filtered.length !== 1 ? "s" : ""} shown
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CERT_TYPES.map((type) => {
          const count    = certs.filter((c) => c.type === type).length;
          const verified = certs.filter((c) => c.type === type && c.verified).length;
          const expired  = certs.filter((c) => c.type === type && c.status === "expired").length;
          const shortName = type.replace(" Certificate", "").replace(" Authorization", "");
          return (
            <div key={type} className="card p-5">
              <div className="font-bold" style={{ fontSize: 30, lineHeight: 1.2, color: "var(--text)" }}>{count}</div>
              <div className="text-sm font-medium mt-1" style={{ color: "var(--text)" }}>{shortName}</div>
              <div className="text-xs mt-1" style={{ color: "#6B7280" }}>
                {verified} verified
                {expired > 0 && (
                  <span style={{ color: "#D64545", fontWeight: 600 }}> · {expired} expired</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-0 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => setFilterType("all")}
          className={`tab-btn ${filterType === "all" ? "active" : ""}`}
          aria-pressed={filterType === "all"}
        >
          All types
        </button>
        {CERT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`tab-btn ${filterType === t ? "active" : ""}`}
            aria-pressed={filterType === t}
          >
            {t.split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>

      <div className="table-wrap" style={{ overflowX: "auto" }}>
        <table style={{ minWidth: 980 }}>
          <thead>
            <tr>
              <th>#</th><th>Certificate no.</th><th>Type</th><th>Area / Unit</th>
              <th>Issuer</th><th>Issued</th><th>Expiry</th>
              <th>Status</th><th>Task ref.</th><th>Verified</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2, 3, 4].map((r) => (
                <tr key={r}>
                  {Array.from({ length: 11 }).map((_, c) => (
                    <td key={c}><div className="rounded" style={{ height: 14, background: "var(--border-soft)" }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: "48px 16px" }}>
                  <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>No certificates found</div>
                  <div className="text-xs mt-1" style={{ color: "#6B7280" }}>Try a different certificate type.</div>
                </td>
              </tr>
            ) : (
              filtered.map((cert, idx) => (
                <tr key={cert.id}>
                  <td>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>{String(idx + 1).padStart(3, "0")}</span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{cert.id}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "var(--text)" }}>{cert.type}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{cert.area}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{cert.issuer}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{cert.issued}</span>
                  </td>
                  <td>
                    <span
                      className="text-xs"
                      style={{
                        color: cert.expiry <= "2024-12-13" ? "#D64545" : "var(--text)",
                        fontWeight: cert.expiry <= "2024-12-13" ? 600 : 400,
                      }}
                    >
                      {cert.expiry}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={cert.status} />
                  </td>
                  <td>
                    <Link href={`/tasks/${cert.taskRef}`} className="link-action" style={{ fontSize: 12 }}>
                      {cert.taskRef}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={cert.verified ? "verified" : "unverified"} />
                  </td>
                  <td>
                    {!cert.verified && canVerify && (
                      <button
                        onClick={() => setSelected(cert)}
                        className="btn-outline"
                        style={{ fontSize: 12, padding: "5px 10px" }}
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!canVerify && (
        <div className="text-xs" style={{ color: "#6B7280" }}>
          Your role ({cap(role)}) cannot verify certificates.
        </div>
      )}
    </div>
  );
}
