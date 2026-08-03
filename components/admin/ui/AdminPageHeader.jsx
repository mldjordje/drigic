import AdminIcon from "@/components/admin/ui/AdminIcon";

/**
 * Standard banner at the top of every admin module: what the screen is, what it
 * is for in one sentence, and the actions that belong to the whole screen.
 */
export default function AdminPageHeader({
  icon = "dashboard",
  title,
  description,
  actions = null,
  meta = null,
  as: Heading = "h2",
}) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header-main">
        <span className="admin-page-header-icon" aria-hidden="true">
          <AdminIcon name={icon} size={22} />
        </span>
        <div className="admin-page-header-text">
          <Heading>{title}</Heading>
          {description ? <p>{description}</p> : null}
          {meta ? <div className="admin-btn-row" style={{ marginTop: 10 }}>{meta}</div> : null}
        </div>
      </div>
      {actions ? <div className="admin-page-header-actions">{actions}</div> : null}
    </header>
  );
}
