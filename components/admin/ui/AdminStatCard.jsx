import Link from "next/link";
import AdminIcon from "@/components/admin/ui/AdminIcon";

/**
 * KPI tile. Pass `href` to turn the whole card into a shortcut to the module the
 * number came from — that is how the dashboard doubles as navigation.
 */
export default function AdminStatCard({ icon, label, value, hint, tone = "gold", href }) {
  const body = (
    <>
      <div className="admin-stat-card-head">
        {icon ? (
          <span className="admin-stat-card-icon" aria-hidden="true">
            <AdminIcon name={icon} size={18} />
          </span>
        ) : null}
        <span className="admin-stat-card-label">{label}</span>
      </div>
      <strong className="admin-stat-card-value">{value}</strong>
      {hint ? <span className="admin-stat-card-hint">{hint}</span> : null}
    </>
  );

  const className = `admin-stat-card admin-stat-card--${tone}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
