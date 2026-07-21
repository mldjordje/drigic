const TONE_DETAILS = {
  success: { label: "Success", icon: "✓" },
  info: { label: "Information", icon: "i" },
  warning: { label: "Warning", icon: "!" },
  error: { label: "Error", icon: "!" },
};

export default function AdminStatusMessage({ tone = "info", toneLabel, title, children }) {
  const details = TONE_DETAILS[tone] || TONE_DETAILS.info;
  const isError = tone === "error";
  const label = toneLabel || details.label;

  return (
    <div
      className={`admin-status-message admin-status-message--${tone in TONE_DETAILS ? tone : "info"}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <span className="admin-status-message__icon" aria-hidden="true">{details.icon}</span>
      <div className="admin-status-message__content">
        <span className="admin-status-message__tone">{label}</span>
        {title ? <strong className="admin-status-message__title">{title}</strong> : null}
        {children ? <div className="admin-status-message__body">{children}</div> : null}
      </div>
    </div>
  );
}
