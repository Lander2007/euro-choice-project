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

export default function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABEL[status] || status;
  return <span className={`badge ${toneFor(status)}`}>{label}</span>;
}
