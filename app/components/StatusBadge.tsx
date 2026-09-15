const STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  ongoing: "Ongoing",
  submitted: "Submitted",
  pending: "Pending",
  expired: "Expired",
  rejected: "Rejected",
  returned: "Returned",
  closed: "Closed",
  cancelled: "Cancelled",
  verified: "Verified",
  unverified: "Unverified",
};

/* Yellow tint: approved / verified states. Blue tint: informational
   in-progress states (submitted, ongoing). Red tint: strictly
   critical / expired / rejected states. Grey: all other neutrals. */
function toneFor(status: string): string {
  switch (status) {
    case "approved":
    case "verified":
      return "badge-green";
    case "pending":
    case "returned":
      return "badge-yellow";
    case "submitted":
    case "ongoing":
      return "badge-blue";
    case "expired":
    case "rejected":
      return "badge-red";
    default:
      return "badge-grey";
  }
}

function dotColorFor(status: string): string {
  switch (status) {
    case "approved":
    case "verified":
      return "bg-emerald-500";
    case "pending":
    case "returned":
      return "bg-amber-500";
    case "submitted":
    case "ongoing":
      return "bg-blue-500";
    case "expired":
    case "rejected":
      return "bg-rose-500";
    default:
      return "bg-slate-400";
  }
}

export default function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABEL[status] || status;
  const tone = toneFor(status);
  const dot = dotColorFor(status);
  return (
    <span className={`badge ${tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dot}`} />
      <span>{label}</span>
    </span>
  );
}
