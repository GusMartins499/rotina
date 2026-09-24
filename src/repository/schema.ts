import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const commitments = sqliteTable(
  "commitments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    dailyMinutes: integer("daily_minutes"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    check(
      "commitments_daily_minutes_range",
      sql`${table.dailyMinutes} IS NULL OR (${table.dailyMinutes} >= 30 AND ${table.dailyMinutes} <= 1020)`,
    ),
  ],
);

export const weeks = sqliteTable(
  "weeks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mondayDate: text("monday_date").notNull().unique(),
    kind: text("kind", { enum: ["current", "next"] })
      .notNull()
      .unique(),
  },
  (table) => [check("weeks_kind_values", sql`${table.kind} IN ('current', 'next')`)],
);

export const blocks = sqliteTable(
  "blocks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    weekId: integer("week_id")
      .notNull()
      .references(() => weeks.id, { onDelete: "cascade" }),
    commitmentId: integer("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
  },
  (table) => [
    check("blocks_weekday_range", sql`${table.weekday} >= 0 AND ${table.weekday} <= 6`),
    check("blocks_within_day", sql`${table.startMinute} >= 0 AND ${table.endMinute} <= 1020`),
    check("blocks_positive_duration", sql`${table.endMinute} > ${table.startMinute}`),
  ],
);

export type Commitment = typeof commitments.$inferSelect;
export type Week = typeof weeks.$inferSelect;
export type Block = typeof blocks.$inferSelect;

export const templateBlocks = sqliteTable(
  "template_blocks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    commitmentId: integer("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
  },
  (table) => [
    check("template_weekday_range", sql`${table.weekday} >= 0 AND ${table.weekday} <= 6`),
    check("template_within_day", sql`${table.startMinute} >= 0 AND ${table.endMinute} <= 1020`),
    check("template_positive_duration", sql`${table.endMinute} > ${table.startMinute}`),
  ],
);

export type TemplateBlock = typeof templateBlocks.$inferSelect;
