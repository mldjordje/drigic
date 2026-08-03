import { Resend } from "resend";
import { env } from "@/lib/env";

let resendClient = null;
const FALLBACK_FROM = "Dr Igic Clinic <onboarding@resend.dev>";

export function getEmailConfigurationStatus() {
  const missing = [];

  if (!String(env.RESEND_API_KEY || "").trim()) {
    missing.push("RESEND_API_KEY");
  }

  return {
    configured: missing.length === 0,
    missing,
    from: resolveFromEmail(),
    replyTo: resolveReplyTo() || null,
  };
}

function getResendClient() {
  if (!getEmailConfigurationStatus().configured) {
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

function resolveReplyTo() {
  const replyTo = String(env.RESEND_REPLY_TO || "").trim();
  return replyTo || undefined;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toParagraphs(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildTransactionalText({
  heading,
  intro,
  sections = [],
  ctaLabel,
  ctaUrl,
  footerLines = [],
  unsubscribeUrl,
}) {
  const lines = [];

  if (heading) {
    lines.push(String(heading).trim(), "");
  }

  toParagraphs(intro).forEach((paragraph) => {
    lines.push(paragraph);
  });

  if (sections.length) {
    lines.push("");
    sections.forEach((section) => {
      lines.push(`${section.label}: ${section.value}`);
    });
  }

  if (ctaLabel && ctaUrl) {
    lines.push("", `${ctaLabel}: ${ctaUrl}`);
  }

  if (footerLines.length) {
    lines.push("");
    footerLines.forEach((line) => lines.push(String(line).trim()));
  }

  if (unsubscribeUrl) {
    lines.push("", `Odjava sa liste obavestenja: ${unsubscribeUrl}`);
  }

  return lines.join("\n").trim();
}

function buildTransactionalHtml({
  previewText,
  heading,
  intro,
  sections = [],
  ctaLabel,
  ctaUrl,
  footerLines = [],
  imageUrl,
  unsubscribeUrl,
}) {
  const introHtml = toParagraphs(intro)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.7;">${escapeHtml(
          paragraph
        )}</p>`
    )
    .join("");

  const sectionRows = sections
    .map(
      (section) => `
        <tr>
          <td style="padding:10px 0 6px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
            ${escapeHtml(section.label)}
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 12px;color:#111827;font-size:15px;line-height:1.6;">
            ${escapeHtml(section.value)}
          </td>
        </tr>
      `
    )
    .join("");

  const footerHtml = footerLines
    .map(
      (line) =>
        `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">${escapeHtml(
          line
        )}</p>`
    )
    .join("");

  const ctaHtml =
    ctaLabel && ctaUrl
      ? `
          <div style="margin:24px 0 22px;">
            <a
              href="${escapeHtml(ctaUrl)}"
              style="display:inline-block;padding:13px 18px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;"
            >
              ${escapeHtml(ctaLabel)}
            </a>
          </div>
        `
      : "";

  const imageHtml = imageUrl
    ? `
        <div style="margin:0 0 20px;">
          <img
            src="${escapeHtml(imageUrl)}"
            alt=""
            width="564"
            style="display:block;width:100%;max-width:564px;height:auto;border:0;border-radius:14px;"
          />
        </div>
      `
    : "";

  const unsubscribeHtml = unsubscribeUrl
    ? `
        <p style="margin:14px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
          Ne želite više ovakve poruke?
          <a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b7280;text-decoration:underline;">
            Odjavite se jednim klikom
          </a>.
        </p>
      `
    : "";

  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(previewText || heading || "")}
    </div>
    <div style="margin:0;padding:28px 14px;background:#f4f1ec;font-family:Arial,sans-serif;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
        <div style="padding:28px 28px 18px;background:linear-gradient(180deg,#faf7f2 0%,#ffffff 100%);border-bottom:1px solid #ece5dc;">
          <div style="color:#8a6f4d;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
            Dr Igic Clinic
          </div>
          <h1 style="margin:12px 0 0;color:#111827;font-size:28px;line-height:1.2;">${escapeHtml(
            heading
          )}</h1>
        </div>
        <div style="padding:26px 28px 10px;">
          ${imageHtml}
          ${introHtml}
          ${
            sectionRows
              ? `
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:12px 0 0;border-top:1px solid #ece5dc;">
                    <tbody>${sectionRows}</tbody>
                  </table>
                `
              : ""
          }
          ${ctaHtml}
        </div>
        <div style="padding:0 28px 28px;">
          ${footerHtml}
          ${unsubscribeHtml}
        </div>
      </div>
    </div>
  `;
}

export function buildEmailContent(content = {}) {
  return {
    text: buildTransactionalText(content),
    html: buildTransactionalHtml(content),
  };
}

export async function sendEmailBatch(messages = []) {
  const configStatus = getEmailConfigurationStatus();
  const resend = getResendClient();
  if (!resend) {
    return {
      sent: false,
      reason: `Email delivery is not configured (${configStatus.missing.join(", ")})`,
      code: "EMAIL_NOT_CONFIGURED",
      missing: configStatus.missing,
      ids: [],
    };
  }

  if (!messages.length) {
    return { sent: true, ids: [] };
  }

  const payload = messages.map((message) => ({
    from: resolveFromEmail(),
    to: message.to,
    replyTo: message.replyTo || resolveReplyTo(),
    subject: message.subject,
    text: message.text,
    html: message.html,
    ...(message.headers ? { headers: message.headers } : {}),
  }));

  const response = await resend.batch.send(payload);

  if (response?.error) {
    return {
      sent: false,
      reason: response.error.message || "Resend batch send failed",
      ids: [],
    };
  }

  const ids = (response?.data?.data || []).map((item) => item?.id || null);
  return { sent: true, ids };
}

export async function sendTransactionalEmail({
  to,
  subject,
  previewText,
  heading,
  intro,
  sections = [],
  ctaLabel,
  ctaUrl,
  footerLines = [],
  imageUrl,
  unsubscribeUrl,
  headers,
  replyTo,
}) {
  const configStatus = getEmailConfigurationStatus();
  const resend = getResendClient();
  if (!resend) {
    return {
      sent: false,
      reason: `Email delivery is not configured (${configStatus.missing.join(", ")})`,
      code: "EMAIL_NOT_CONFIGURED",
      missing: configStatus.missing,
    };
  }

  const { text, html } = buildEmailContent({
    previewText,
    heading,
    intro,
    sections,
    ctaLabel,
    ctaUrl,
    footerLines,
    imageUrl,
    unsubscribeUrl,
  });

  const response = await resend.emails.send({
    from: resolveFromEmail(),
    to,
    replyTo: replyTo || resolveReplyTo(),
    subject,
    text,
    html,
    ...(headers ? { headers } : {}),
  });

  if (response?.error) {
    return { sent: false, reason: response.error.message || "Resend send failed" };
  }

  return { sent: true, id: response?.data?.id || null };
}

export async function sendOtpEmail({ to, code }) {
  return sendTransactionalEmail({
    to,
    subject: "Dr Igic OTP kod za prijavu",
    previewText: "Jednokratni kod za bezbednu prijavu",
    heading: "Kod za prijavu",
    intro:
      "Koristite sledeci jednokratni kod da biste se prijavili u svoj nalog. Kod vazi 10 minuta.",
    sections: [
      {
        label: "Jednokratni kod",
        value: String(code),
      },
      {
        label: "Vazenje",
        value: "10 minuta",
      },
    ],
    footerLines: [
      "Ako niste zatrazili prijavu, slobodno zanemarite ovu poruku.",
    ],
  });
}

export async function sendReminderEmail({ to, title, message }) {
  return sendTransactionalEmail({
    to,
    subject: title,
    previewText: title,
    heading: title,
    intro: message,
    footerLines: ["Ovo je transakciona poruka iz sistema klinike Dr Igic."],
  });
}
