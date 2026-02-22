import { Resend } from "resend";
import { env } from "@/lib/env";

let resendClient = null;
const FALLBACK_FROM = "onboarding@resend.dev";

function getResendClient() {
  if (!env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

function resolveFromEmail() {
  const from = String(env.RESEND_FROM || "").trim();
  return from || FALLBACK_FROM;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendOtpEmail({ to, code }) {
  const resend = getResendClient();

  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY missing" };
  }

  const response = await resend.emails.send({
    from: resolveFromEmail(),
    to,
    subject: "Dr Igic OTP kod za prijavu",
    text: `Vas jednokratni kod je: ${code}. Kod vazi 10 minuta.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Prijava na Dr Igic aplikaciju</h2>
        <p>Vas jednokratni kod je:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:3px">${code}</p>
        <p>Kod vazi 10 minuta.</p>
      </div>
    `,
  });

  if (response?.error) {
    return { sent: false, reason: response.error.message || "Resend send failed" };
  }

  return { sent: true, id: response?.data?.id || null };
}

export async function sendReminderEmail({ to, title, message }) {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY missing" };
  }

  const safeMessageHtml = escapeHtml(message).replaceAll("\n", "<br/>");
  const response = await resend.emails.send({
    from: resolveFromEmail(),
    to,
    subject: title,
    text: message,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><p>${safeMessageHtml}</p></div>`,
  });

  if (response?.error) {
    return { sent: false, reason: response.error.message || "Resend send failed" };
  }

  return { sent: true, id: response?.data?.id || null };
}
