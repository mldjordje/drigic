import AdminIcon from "@/components/admin/ui/AdminIcon";

/**
 * Wraps a single form control with a label, an optional icon, a required/optional
 * flag and a plain-language hint that says what the value actually does.
 *
 * The control is nested inside the <label>, so no id wiring is needed and the
 * component stays usable from both server and client pages.
 */
export default function AdminField({
  label,
  hint,
  icon,
  error,
  required = false,
  optional = false,
  flagLabel,
  children,
  className = "",
}) {
  const flagText = flagLabel || (required ? "*" : optional ? "opciono" : "");

  return (
    <label className={`admin-field ${error ? "has-error" : ""} ${className}`.trim()}>
      <span className="admin-field-label">
        {icon ? <AdminIcon name={icon} size={15} /> : null}
        {label}
        {flagText ? (
          <span className={`admin-field-flag ${required ? "is-required" : ""}`.trim()}>{flagText}</span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="admin-field-hint">{hint}</span> : null}
      {error ? (
        <span className="admin-field-error">
          <AdminIcon name="warning" size={14} />
          {error}
        </span>
      ) : null}
    </label>
  );
}
