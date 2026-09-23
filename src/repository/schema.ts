import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const commitments = sqliteTable("commitments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  dailyHours: integer("daily_hours"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const weeks = sqliteTable("weeks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mondayDate: text("monday_date").notNull().unique(),
  kind: text("kind", { enum: ["current", "next"] }).notNull(),
});

export const blocks = sqliteTable("blocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekId: integer("week_id")
    .notNull()
    .references(() => weeks.id, { onDelete: "cascade" }),
  commitmentId: integer("commitment_id")
    .notNull()
    .references(() => commitments.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(),
  startHour: integer("start_hour").notNull(),
  endHour: integer("end_hour").notNull(),
});

export type Commitment = typeof commitments.$inferSelect;
export type Week = typeof weeks.$inferSelect;
export type Block = typeof blocks.$inferSelect;
