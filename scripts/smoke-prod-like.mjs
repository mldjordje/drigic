import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { SignJWT } from "jose";

dotenv.config({ path: ".env.local" });

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:4012";
const jwtSecret = process.env.AUTH_JWT_SECRET;
const dbUrl =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!jwtSecret) {
  throw new Error("AUTH_JWT_SECRET is required for smoke-prod-like.");
}
if (!dbUrl) {
  throw new Error("Database URL missing.");
}

const sql = neon(dbUrl);
const encoder = new TextEncoder();
const secretKey = encoder.encode(jwtSecret);

const checks = [];

function addCheck(name, ok, detail) {
  checks.push({ name, ok, detail });
}

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

async function createSessionToken(user) {
  const now = nowUnix();
  return new SignJWT({
    sub: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone || null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 2)
    .sign(secretKey);
}

async function upsertUser(email, role = "client") {
  const rows = await sql`
    INSERT INTO users (email, role, created_at, updated_at)
    VALUES (${email}, ${role}, NOW(), NOW())
    ON CONFLICT (email)
    DO UPDATE SET role = ${role}, updated_at = NOW()
    RETURNING id, email, role, phone
  `;
  return rows[0];
}

async function api(path, { method = "GET", body, cookie, redirect = "manual" } = {}) {
  const headers = {};
  if (cookie) {
    headers.Cookie = cookie;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return {
    status: response.status,
    location: response.headers.get("location"),
    data,
    text,
  };
}

function pickServiceSelection(categories) {
  const services = [];
  for (const category of categories || []) {
    for (const service of category?.services || []) {
      services.push(service);
    }
  }

  const simple = services.find((service) => service.kind === "single" && !service.supportsMl);
  if (simple) {
    return { serviceId: simple.id, quantity: 1 };
  }

  const fallback = services.find((service) => service.kind === "single");
  if (!fallback) {
    return null;
  }

  if (
    fallback.supportsMl &&
    String(fallback.name || "")
      .toLowerCase()
      .includes("hijaluronski filer")
  ) {
    return { serviceId: fallback.id, quantity: 1, brand: "revolax" };
  }

  return { serviceId: fallback.id, quantity: 1 };
}

function getMonthKeys() {
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const next = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  return [current, next];
}

async function run() {
  const anonAdmin = await api("/admin/kalendar");
  addCheck(
    "anon_admin_redirect",
    anonAdmin.status >= 300 &&
      anonAdmin.status < 400 &&
      String(anonAdmin.location || "").includes("/prijava"),
    `status=${anonAdmin.status} location=${anonAdmin.location || "-"}`
  );

  const clientEmail = `smoke.client.${Date.now()}@drigic.local`;
  const clientUser = await upsertUser(clientEmail, "client");
  const adminUser = await upsertUser("smoke.admin@drigic.local", "admin");

  const clientCookie = `drigic_session=${await createSessionToken(clientUser)}`;
  const adminCookie = `drigic_session=${await createSessionToken(adminUser)}`;

  const me = await api("/api/me/profile", { cookie: clientCookie });
  addCheck(
    "client_profile",
    me.status === 200 && me.data?.user?.role === "client",
    `status=${me.status} role=${me.data?.user?.role || "-"}`
  );

  const services = await api("/api/services", { cookie: clientCookie });
  const selection = pickServiceSelection(services.data?.categories || []);
  addCheck(
    "services_loaded",
    services.status === 200 && Boolean(selection),
    `status=${services.status} serviceId=${selection?.serviceId || "-"}`
  );
  if (!selection) {
    throw new Error("No valid service for smoke booking.");
  }

  const serviceSelections = [selection];
  const quote = await api("/api/bookings/quote", {
    method: "POST",
    cookie: clientCookie,
    body: { serviceSelections },
  });
  addCheck(
    "booking_quote",
    quote.status === 200 && quote.data?.ok === true,
    `status=${quote.status} duration=${quote.data?.totalDurationMin || "-"}`
  );

  let selectedDate = null;
  for (const month of getMonthKeys()) {
    const monthData = await api(
      `/api/bookings/availability?month=${encodeURIComponent(month)}&serviceSelections=${encodeURIComponent(
        JSON.stringify(serviceSelections)
      )}`,
      { cookie: clientCookie }
    );
    const firstOpen = (monthData.data?.days || []).find(
      (day) => Number(day?.availableSlots || 0) > 0
    );
    if (firstOpen) {
      selectedDate = firstOpen.date;
      addCheck("availability_month", true, `month=${month} date=${selectedDate}`);
      break;
    }
  }

  if (!selectedDate) {
    addCheck("availability_month", false, "No open date found in current/next month.");
    throw new Error("No open date found.");
  }

  const dayData = await api(
    `/api/bookings/availability?date=${encodeURIComponent(
      selectedDate
    )}&serviceSelections=${encodeURIComponent(JSON.stringify(serviceSelections))}`,
    { cookie: clientCookie }
  );
  const availableSlots = (dayData.data?.slots || []).filter((slot) => slot?.available);
  addCheck(
    "availability_day",
    dayData.status === 200 && availableSlots.length > 0,
    `status=${dayData.status} slots=${availableSlots.length}`
  );

  let booked = null;
  for (const slot of availableSlots.slice(0, 6)) {
    const bookingRes = await api("/api/bookings", {
      method: "POST",
      cookie: clientCookie,
      body: {
        serviceSelections,
        startAt: slot.startAt,
        notes: "Smoke prod-like booking",
      },
    });

    if (bookingRes.status === 201 && bookingRes.data?.ok) {
      booked = bookingRes.data.booking;
      break;
    }
    if (bookingRes.status !== 409) {
      addCheck("booking_create_client", false, `status=${bookingRes.status} body=${bookingRes.text}`);
      throw new Error(`Booking failed with status ${bookingRes.status}`);
    }
  }

  addCheck(
    "booking_create_client",
    Boolean(booked?.id),
    `bookingId=${booked?.id || "-"} status=${booked?.status || "-"}`
  );

  const blockedAdmin = await api("/api/admin/bookings", { cookie: clientCookie });
  addCheck(
    "client_blocked_from_admin_api",
    blockedAdmin.status === 403,
    `status=${blockedAdmin.status}`
  );

  const adminBookings = await api("/api/admin/bookings", { cookie: adminCookie });
  addCheck(
    "admin_bookings_api",
    adminBookings.status === 200 && adminBookings.data?.ok === true,
    `status=${adminBookings.status} rows=${adminBookings.data?.data?.length ?? "-"}`
  );
}

try {
  await run();
} catch (error) {
  addCheck("smoke_runtime", false, error?.message || String(error));
}

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(
    `${check.ok ? "[OK]" : "[FAIL]"} ${check.name} :: ${check.detail}`
  );
}

if (failed.length > 0) {
  process.exit(1);
}
process.exit(0);
