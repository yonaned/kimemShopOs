// File: backend/src/db/schema.ts

import {
  boolean,
  doublePrecision,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";


// 1. Users Table
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  phoneNumber: varchar({ length: 20 }).notNull().unique(),
  name: varchar({ length: 255 }),
  username: varchar({ length: 100 }).unique(),
  email: varchar({ length: 255 }).unique(),
  profilePhoto: text(),
  role: varchar({ length: 50 }).notNull().default("owner"),
  isProfileComplete: boolean().notNull().default(false),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

// 2. OTP Verification Table
export const otpsTable = pgTable(
  "otps",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    phoneNumber: varchar({ length: 20 }).notNull(),
    code: varchar({ length: 6 }).notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    isVerified: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    phoneNumberIdx: index("otps_phone_number_idx").on(table.phoneNumber),
  })
);

// 3. Shops Table
export const shopsTable = pgTable("shops", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar({ length: 255 }).notNull(),
  logo: text(),
  latitude: doublePrecision().notNull(),
  longitude: doublePrecision().notNull(),
  address: text(),
  estimatedMonthlyRevenue: numeric({ precision: 15, scale: 2 }),
  currency: varchar({ length: 10 }).notNull().default("USD"),
  businessCategory: varchar({ length: 100 }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
