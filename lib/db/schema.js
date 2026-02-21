import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const roleEnum = pgEnum("role", ["client", "admin"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);
export const serviceKindEnum = pgEnum("service_kind", ["single", "package"]);
export const vipRequestStatusEnum = pgEnum("vip_request_status", [
  "pending",
  "approved",
  "rejected",
]);
export const penaltyStatusEnum = pgEnum("penalty_status", ["unpaid", "paid", "waived"]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    role: roleEnum("role").default("client").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    phoneUnique: uniqueIndex("users_phone_unique").on(table.phone),
  })
);

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }),
  gender: varchar("gender", { length: 32 }),
  birthDate: date("birth_date"),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    employeeSlugUnique: uniqueIndex("employees_slug_unique").on(table.slug),
  })
);

export const clinicSettings = pgTable("clinic_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  slotMinutes: integer("slot_minutes").default(15).notNull(),
  bookingWindowDays: integer("booking_window_days").default(31).notNull(),
  workdayStart: varchar("workday_start", { length: 5 }).default("16:00").notNull(),
  workdayEnd: varchar("workday_end", { length: 5 }).default("21:00").notNull(),
  ...timestamps,
});

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const bodyAreas = pgTable("body_areas", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => serviceCategories.id, { onDelete: "restrict" }),
    bodyAreaId: uuid("body_area_id").references(() => bodyAreas.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    kind: serviceKindEnum("kind").default("single").notNull(),
    colorHex: varchar("color_hex", { length: 16 }).default("#8e939b").notNull(),
    supportsMl: boolean("supports_ml").default(false).notNull(),
    maxMl: integer("max_ml").default(1).notNull(),
    extraMlDiscountPercent: integer("extra_ml_discount_percent").default(0).notNull(),
    priceRsd: integer("price_rsd").notNull(),
    durationMin: integer("duration_min").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isVip: boolean("is_vip").default(false).notNull(),
    ...timestamps,
  },
  (table) => ({
    serviceCategoryIdx: index("services_category_idx").on(table.categoryId),
    serviceMaxMlCheck: check("services_max_ml_check", sql`${table.maxMl} >= 1`),
    serviceMlDiscountCheck: check(
      "services_ml_discount_check",
      sql`${table.extraMlDiscountPercent} >= 0 AND ${table.extraMlDiscountPercent} <= 40`
    ),
  })
);

export const servicePackageItems = pgTable(
  "service_package_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    packageServiceId: uuid("package_service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    quantity: integer("quantity").default(1).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => ({
    packageServiceIdx: index("service_package_items_package_idx").on(
      table.packageServiceId
    ),
    packageServiceUnique: uniqueIndex("service_package_items_unique").on(
      table.packageServiceId,
      table.serviceId
    ),
  })
);

export const servicePromotions = pgTable("service_promotions", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  promoPriceRsd: integer("promo_price_rsd").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: bookingStatusEnum("status").default("pending").notNull(),
    totalPriceRsd: integer("total_price_rsd").notNull(),
    totalDurationMin: integer("total_duration_min").notNull(),
    primaryServiceColor: varchar("primary_service_color", { length: 16 }),
    notes: text("notes"),
    cancellationReason: text("cancellation_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    noShowMarkedAt: timestamp("no_show_marked_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    bookingEmployeeIdx: index("bookings_employee_idx").on(table.employeeId),
    bookingStartsIdx: index("bookings_starts_idx").on(table.startsAt),
    bookingUserIdx: index("bookings_user_idx").on(table.userId),
  })
);

export const bookingItems = pgTable("booking_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "restrict" }),
  quantity: integer("quantity").default(1).notNull(),
  unitLabel: varchar("unit_label", { length: 24 }).default("kom").notNull(),
  serviceNameSnapshot: varchar("service_name_snapshot", { length: 255 }).notNull(),
  priceRsdSnapshot: integer("price_rsd_snapshot").notNull(),
  durationMinSnapshot: integer("duration_min_snapshot").notNull(),
  serviceColorSnapshot: varchar("service_color_snapshot", { length: 16 }),
  sourcePackageServiceId: uuid("source_package_service_id").references(() => services.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

export const bookingBlocks = pgTable(
  "booking_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    durationMin: integer("duration_min").notNull(),
    note: text("note"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => ({
    blockEmployeeIdx: index("booking_blocks_employee_idx").on(table.employeeId),
    blockStartsIdx: index("booking_blocks_starts_idx").on(table.startsAt),
  })
);

export const bookingStatusLog = pgTable("booking_status_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  previousStatus: bookingStatusEnum("previous_status"),
  nextStatus: bookingStatusEnum("next_status").notNull(),
  changedByUserId: uuid("changed_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const treatmentRecords = pgTable("treatment_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "restrict" }),
  treatmentDate: timestamp("treatment_date", { withTimezone: true }).notNull(),
  notes: text("notes"),
  correctionDueDate: date("correction_due_date"),
  ...timestamps,
});

export const treatmentRecordMedia = pgTable("treatment_record_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  treatmentRecordId: uuid("treatment_record_id")
    .notNull()
    .references(() => treatmentRecords.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
  mediaType: varchar("media_type", { length: 32 }).default("image").notNull(),
  ...timestamps,
});

export const beforeAfterCases = pgTable("before_after_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  treatmentType: varchar("treatment_type", { length: 255 }).notNull(),
  productUsed: varchar("product_used", { length: 255 }),
  beforeImageUrl: text("before_image_url").notNull(),
  afterImageUrl: text("after_image_url").notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  ...timestamps,
});

export const galleryMedia = pgTable("gallery_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  mediaUrl: text("media_url").notNull(),
  mediaType: varchar("media_type", { length: 32 }).default("image").notNull(),
  caption: text("caption"),
  ...timestamps,
});

export const videoLinks = pgTable("video_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  youtubeUrl: text("youtube_url").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  ...timestamps,
});

export const homeAnnouncements = pgTable("home_announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const vipSettings = pgTable("vip_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  basePriceRsd: integer("base_price_rsd").default(0).notNull(),
  notes: text("notes"),
  ...timestamps,
});

export const vipRequests = pgTable("vip_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  requestedDate: timestamp("requested_date", { withTimezone: true }),
  message: text("message"),
  status: vipRequestStatusEnum("status").default("pending").notNull(),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
});

export const penalties = pgTable("penalties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  amountRsd: integer("amount_rsd").default(2000).notNull(),
  reason: text("reason").default("No-show penalty").notNull(),
  status: penaltyStatusEnum("status").default("unpaid").notNull(),
  ...timestamps,
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 24 }).default("in_app").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  status: notificationStatusEnum("status").default("pending").notNull(),
  ...timestamps,
});

export const notificationJobs = pgTable("notification_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: varchar("kind", { length: 64 }).notNull(),
  payload: jsonb("payload").notNull(),
  runAt: timestamp("run_at", { withTimezone: true }).notNull(),
  status: notificationStatusEnum("status").default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  lastError: text("last_error"),
  ...timestamps,
});

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    pushUserIdx: index("push_subscriptions_user_idx").on(table.userId),
    pushEndpointUnique: uniqueIndex("push_subscriptions_endpoint_unique").on(
      table.endpoint
    ),
  })
);

export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  codeHash: varchar("code_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
