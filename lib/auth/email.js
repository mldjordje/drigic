import { Resend } from "resend";
import { env } from "@/lib/env";

let resendClient = null;

function getResendClient() {
  if (!env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendOtpEmail({ to, code }) {
  const resend = getResendClient();

  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY missing" };
  }

  await resend.emails.send({
    from: env.RESEND_FROM,
    to,
    subject: "Dr Igić OTP kod za prijavu",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Prijava na Dr Igić aplikaciju</h2>
        <p>Vaš jednokratni kod je:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:3px">${code}</p>
        <p>Kod važi 10 minuta.</p>
      </div>
    `,
  });

  return { sent: true };
}

export async function sendReminderEmail({ to, title, message }) {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY missing" };
  }

  await resend.emails.send({
    from: env.RESEND_FROM,
    to,
    subject: title,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><p>${message}</p></div>`,
  });

  return { sent: true };
}

