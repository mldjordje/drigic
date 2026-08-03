import AdminIcon from "@/components/admin/ui/AdminIcon";

/**
 * A titled block inside a module page. `description` is not optional polish —
 * it is where the screen explains what the controls below actually change.
 */
export default function AdminSection({
  icon,
  title,
  description,
  actions = null,
  children,
  className = "",
  as: Heading = "h3",
}) {
  return (
    <section className={`admin-section ${className}`.trim()}>
      {title || actions ? (
        <div className="admin-section-head">
          <div style={{ minWidth: 0 }}>
            {title ? (
              <Heading className="admin-section-title">
                {icon ? <AdminIcon name={icon} size={18} /> : null}
                {title}
              </Heading>
            ) : null}
            {description ? <p className="admin-section-desc">{description}</p> : null}
          </div>
          {actions ? <div className="admin-section-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
