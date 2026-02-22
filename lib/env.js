import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_URL: z.string().url().optional(),
  POSTGRES_PRISMA_URL: z.string().url().optional(),
  AUTH_JWT_SECRET: z.string().min(32).optional(),
  AUTH_OTP_SALT: z.string().min(8).optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().email().default("onboarding@resend.dev"),
  ADMIN_BOOKING_NOTIFY_EMAIL: z
    .string()
    .email()
    .default("igic.nikola8397@gmail.com"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  APP_URL: z.string().url().optional(),
  CRON_SECRET: z.string().optional(),
  WEB_PUSH_PUBLIC_KEY: z.string().optional(),
  WEB_PUSH_PRIVATE_KEY: z.string().optional(),
  WEB_PUSH_SUBJECT: z.string().optional(),
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: z.string().optional(),
  CLINIC_DEFAULT_EMPLOYEE_SLUG: z.string().default("nikola-igic"),
  CLINIC_WORKDAY_START: z.string().default("16:00"),
  CLINIC_WORKDAY_END: z.string().default("21:00"),
  CLINIC_SLOT_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
  CLINIC_BOOKING_WINDOW_DAYS: z.coerce.number().int().min(1).max(60).default(31),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables: ${parsedEnv.error.message}`);
}

const baseEnv = parsedEnv.data;
const databaseUrl =
  baseEnv.POSTGRES_URL || baseEnv.DATABASE_URL || baseEnv.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  throw new Error(
    "Database URL missing. Set POSTGRES_URL or DATABASE_URL in .env.local."
  );
}

export const env = {
  ...baseEnv,
  DATABASE_URL_RESOLVED: databaseUrl,
  AUTH_JWT_SECRET: baseEnv.AUTH_JWT_SECRET || "dev-only-change-this-secret-key-now",
  AUTH_OTP_SALT: baseEnv.AUTH_OTP_SALT || "dev-only-change-this-otp-salt",
};
