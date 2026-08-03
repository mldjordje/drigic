import AdminIcon from "@/components/admin/ui/AdminIcon";

/** Shown instead of an empty list, so a blank screen never looks broken. */
export default function AdminEmptyState({ icon = "list", title, description, action = null }) {
  return (
    <div className="admin-empty">
      <span className="admin-empty-icon" aria-hidden="true">
        <AdminIcon name={icon} size={22} />
      </span>
      {title ? <strong>{title}</strong> : null}
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
