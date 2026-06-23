import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const papers = mysqlTable("papers", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  authors: text("authors"),
  year: varchar("year", { length: 10 }),
  abstract: text("abstract"),
  url: text("url"),
  doi: varchar("doi", { length: 255 }),
  citationCount: varchar("citation_count", { length: 50 }),
  source: varchar("source", { length: 100 }),
  venue: varchar("venue", { length: 255 }),
  topic: varchar("topic", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Paper = typeof papers.$inferSelect;

export const savedPapers = mysqlTable("saved_papers", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  paperId: bigint("paperId", { mode: "number", unsigned: true }).notNull(),
  collection: varchar("collection", { length: 255 }).default("Favorites"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const searchLogs = mysqlTable("search_logs", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  query: varchar("query", { length: 500 }).notNull(),
  resultsCount: varchar("results_count", { length: 20 }),
  source: varchar("source", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  plan: mysqlEnum("plan", ["free", "pro"]).default("free").notNull(),
  searchesUsed: varchar("searches_used", { length: 20 }).default("0"),
  searchesLimit: varchar("searches_limit", { length: 20 }).default("10"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// TODO: Add your tables here.
//
// Example:
// export const posts = mysqlTable("posts", {
//   id: serial("id").primaryKey(),
//   title: varchar("title", { length: 255 }).notNull(),
//   content: text("content"),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });
//
// Note: FK columns referencing a serial() PK must use:
//   bigint("columnName", { mode: "number", unsigned: true }).notNull()
