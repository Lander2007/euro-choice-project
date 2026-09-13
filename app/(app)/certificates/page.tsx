"use client";
import { useState } from "react";

const CERT_TYPES = [
  "Gas Test Certificate",
  "Fire Watch Authorization",
  "Mechanical Isolation Certificate",
  "Electrical Isolation Certificate",
];

const MOCK_CERTS = [
  { id: "GTC-2024-4421", type: "Gas Test Certificate",            area: "Unit-3 Reformer",     issuer: "Hassan Al-Mutairi",  issued: "2024-12-09", expiry: "2024-12-10", status: "expired",   taskRef: "TSK-2024-0847", verified: false },
  { id: "GTC-2024-4430", type: "Gas Test Certificate",            area: "Crude Distillation",  issuer: "Rania Jaber",         issued: "2024-12-12", expiry: "2024-12-13", status: "approved",  taskRef: "TSK-2024-0875", verified: true  },
  { id: "FWA-2024-1183", type: "Fire Watch Authorization",         area: "Unit-3 Reformer",     issuer: "Fire & Safety Dept",  issued: "2024-12-09", expiry: "2024-12-16", status: "ongoing",   taskRef: "TSK-2024-0847", verified: true  },
  { id: "FWA-2024-1190", type: "Fire Watch Authorization",         area: "LPG Sphere Farm",     issuer: "Fire & Safety Dept",  issued: "2024-12-07", expiry: "2024-12-14", status: "pending",   taskRef: "TSK-2024-0831", verified: false },
  { id: "MIC-2024-0872", type: "Mechanical Isolation Certificate", area: "Unit-3 Reformer",     issuer: "Samir Okafor",         issued: "2024-12-08", expiry: "2024-12-16", status: "approved",  taskRef: "TSK-2024-0847", verified: true  },
  { id: "MIC-2024-0880", type: "Mechanical Isolation Certificate", area: "Naphtha Hydrotreater", issuer: "Nadia Petrov",        issued: "2024-12-12", expiry: "2024-12-14", status: "returned",  taskRef: "TSK-2024-0871", verified: false },
  { id: "EIC-2024-0614", type: "Electrical Isolation Certificate", area: "Amine Treating Unit", issuer: "Yusuf Al-Hamdan",     issued: "2024-12-12", expiry: "2024-12-13", status: "submitted", taskRef: "TSK-2024-0868", verified: false },
  { id: "EIC-2024-0620", type: "Electrical Isolation Certificate", area: "Isomerization Unit",  issuer: "Yusuf Al-Hamdan",     issued: "2024-12-13", expiry: "2024-12-14", status: "approved",  taskRef: "TSK-2024-0887", verified: true  },
  { id: "GTC-2024-4438", type: "Gas Test Certificate",            area: "Flare Stack",          issuer: "Hassan Al-Mutairi",  issued: "2024-12-10", expiry: "2024-12-17", status: "ongoing",   taskRef: "TSK-2024-0855", verified: true  },
  { id: "FWA-2024-1195", type: "Fire Watch Authorization",         area: "Diesel Hydrotreater", issuer: "Fire & Safety Dept",  issued: "2024-12-13", expiry: "2024-12-14", status: "pending",   taskRef: "TSK-2024-0879", verified: false },
];

const STATUS_LED: Record<string, string> = {
  approved: "led-green", ongoing: "led-green", submitted: "led-yellow",
  pending:  "led-yellow", expired: "led-red",   rejected:  "led-red",
  returned: "led-amber",  closed:  "led-grey",
};

const STATUS_LABEL: Record<string, string> = {
  approved: "Approved", ongoing: "Ongoing", submitted: "Submitted",
  pending: "Pending", expired: "Expired", rejected: "Rejected",
  returned: "Returned", closed: "Closed",
};

type Cert = typeof MOCK_CERTS[0];

function VerifyModal({ cert, onClose, onVerify }: { cert: Cert; onClose: () => void; onVerify: (id: string) => void }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(30,27,22,0.65)", backdropFilter: "blur(2px)" }}
    >
      <div className="eng-panel rounded-sm p-6 w-full max-w-md mx-4" style={{ boxShadow: "0 8px 40px rgba(30,27,22,0.3)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="font-stencil text-base font-bold" style={{ color: "#1E1B16" }}>
            Manual Verification
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: 16, lineHeight: 1 }}>×</button>
        </div>

        <div
          className="rounded-sm p-4 mb-5"
          style={{ background: "#EDE5CE", border: "1px solid #D4CCB8" }}
        >
          <div className="space-y-2.5">
            {[
              ["Certificate No.", cert.id],
              ["Type",            cert.type],
              ["Area / Unit",     cert.area],
              ["Issuing Authority", cert.issuer],
              ["Date Issued",     cert.issued],
              ["Expiry Date",     cert.expiry],
              ["Linked Task",     cert.taskRef],
              ["Current Status",  STATUS_LABEL[cert.status] || cert.status],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <div className="font-stencil text-xs flex-shrink-0" style={{ color: "#9A9589", width: 130, fontSize: 10 }}>{label}</div>
                <div className="font-mono text-xs" style={{ color: "#1E1B16" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="font-sans text-xs leading-relaxed mb-5" style={{ color: "#9A9589" }}>
          By marking this certificate as verified, you confirm that you have reviewed the physical documentation and all data fields are correct. This action is recorded in the audit log.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => { onVerify(cert.id); onClose(); }}
            className="btn-primary flex-1"
          >
            Mark as Verified
          </button>
          <button onClick={onClose} className="btn-secondary px-5">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const [certs,       setCerts]       = useState(MOCK_CERTS);
  const [filterType,  setFilterType]  = useState("all");
  const [selectedCert, setSelected]  = useState<Cert | null>(null);

  const filtered = filterType === "all" ? certs : certs.filter((c) => c.type === filterType);

  const handleVerify = (id: string) => {
    setCerts((prev) => prev.map((c) => c.id === id ? { ...c, verified: true, status: "approved" } : c));
  };

  return (
    <div className="space-y-5">
      {selectedCert && (
        <VerifyModal cert={selectedCert} onClose={() => setSelected(null)} onVerify={handleVerify} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-stencil text-2xl font-bold" style={{ color: "#1E1B16" }}>Certificate Registry</h1>
          <p className="font-mono text-xs mt-1" style={{ color: "#9A9589" }}>
            Permit documentation — {filtered.length} record{filtered.length !== 1 ? "s" : ""} shown
          </p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {CERT_TYPES.map((type) => {
          const count    = certs.filter((c) => c.type === type).length;
          const verified = certs.filter((c) => c.type === type && c.verified).length;
          const expired  = certs.filter((c) => c.type === type && c.status === "expired").length;
          const shortName = type.replace(" Certificate", "").replace(" Authorization", "").replace(" Isolation Certificate", " Isolation");
          return (
            <div key={type} className="eng-panel rounded-sm p-4">
              <div className="font-stencil text-xs mb-2" style={{ color: "#9A9589", fontSize: 10 }}>{shortName}</div>
              <div className="font-mono text-2xl font-bold" style={{ color: "#1E1B16" }}>{count}</div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <div className="led led-green" style={{ width: 7, height: 7 }} />
                  <span className="font-mono text-xs" style={{ color: "#9A9589", fontSize: 9 }}>{verified} verified</span>
                </div>
                {expired > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="led led-red" style={{ width: 7, height: 7 }} />
                    <span className="font-mono text-xs" style={{ color: "#C1402A", fontSize: 9 }}>{expired} expired</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setFilterType("all")}
          className="font-stencil text-xs px-4 py-2 rounded-sm border transition-all"
          style={{
            background:  filterType === "all" ? "#1E1B16"  : "#FAF7F0",
            color:       filterType === "all" ? "#E3B23C"  : "#6E6A5E",
            borderColor: filterType === "all" ? "#3A3530"  : "#D4CCB8",
          }}
        >
          All Types
        </button>
        {CERT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className="font-stencil text-xs px-4 py-2 rounded-sm border transition-all"
            style={{
              background:  filterType === t ? "#1E1B16"  : "#FAF7F0",
              color:       filterType === t ? "#E3B23C"  : "#6E6A5E",
              borderColor: filterType === t ? "#3A3530"  : "#D4CCB8",
              fontSize: 11,
            }}
          >
            {t.split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrap blueprint-bg">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Certificate No.</th><th>Type</th><th>Area / Unit</th>
              <th>Issuer</th><th>Issued</th><th>Expiry</th>
              <th>Status</th><th>Task Ref.</th><th>Verified</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cert, idx) => (
              <tr key={cert.id}>
                <td style={{ padding: "10px 14px" }}>
                  <span className="font-mono text-xs" style={{ color: "#B4ACAA" }}>{String(idx + 1).padStart(3, "0")}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span className="font-mono text-xs font-bold" style={{ color: "#1E1B16" }}>{cert.id}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span className="font-sans text-xs" style={{ color: "#1E1B16" }}>{cert.type}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span className="font-sans text-xs" style={{ color: "#6E6A5E" }}>{cert.area}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span className="font-sans text-xs" style={{ color: "#6E6A5E" }}>{cert.issuer}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span className="font-mono text-xs" style={{ color: "#6E6A5E" }}>{cert.issued}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span className="font-mono text-xs" style={{ color: cert.expiry <= "2024-12-13" ? "#C1402A" : "#1E1B16", fontWeight: cert.expiry <= "2024-12-13" ? 600 : 400 }}>
                    {cert.expiry}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div className="flex items-center gap-2">
                    <div className={`led ${STATUS_LED[cert.status]}`} />
                    <span className="font-sans text-xs" style={{ color: "#6E6A5E" }}>{STATUS_LABEL[cert.status]}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span className="font-mono text-xs" style={{ color: "#9A9589" }}>{cert.taskRef}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div className={`led ${cert.verified ? "led-green" : "led-grey"}`} />
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {!cert.verified && (
                    <button
                      onClick={() => setSelected(cert)}
                      className="btn-ghost"
                      style={{ fontSize: 10, padding: "4px 8px", color: "#C49020", borderColor: "#D4CCB8" }}
                    >
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
