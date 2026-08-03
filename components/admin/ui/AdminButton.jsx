import Link from "next/link";
import AdminIcon from "@/components/admin/ui/AdminIcon";

/**
 * Buttons and button-styled links share one look. `variant` carries the intent
 * (primary = the one action the screen wants, danger = destructive).
 */
export default function AdminButton({
  icon,
  iconRight,
  variant = "default",
  size = "md",
  block = false,
  href,
  children,
  className = "",
  type = "button",
  ...rest
}) {
  const classes = [
    "admin-btn",
    variant !== "default" ? `admin-btn--${variant}` : "",
    size !== "md" ? `admin-btn--${size}` : "",
    block ? "admin-btn--block" : "",
    !children ? "admin-btn--icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon ? <AdminIcon name={icon} size={16} /> : null}
      {children}
      {iconRight ? <AdminIcon name={iconRight} size={16} /> : null}
    </>
  );

  if (href) {
    const external = href.startsWith("http") || href.startsWith("/api/");
    if (external) {
      return (
        <a href={href} className={classes} {...rest}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
