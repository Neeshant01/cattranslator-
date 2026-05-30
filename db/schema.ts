import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  json,
  int,
  decimal,
  boolean,
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

export const emotionEnum = [
  "hungry",
  "angry",
  "scared",
  "happy",
  "playful",
  "inPain",
  "mating",
  "territorial",
  "greeting",
  "demand",
] as const;

export const intensityEnum = ["low", "medium", "high"] as const;
export const urgencyEnum = ["casual", "moderate", "urgent"] as const;
export const contextEnum = [
  "foodRelated",
  "attentionSeeking",
  "threatResponse",
  "social",
  "physicalState",
] as const;

export const catProfiles = mysqlTable("catProfiles", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  breed: varchar("breed", { length: 100 }),
  age: int("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  color: varchar("color", { length: 50 }),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  personalityTags: json("personalityTags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CatProfile = typeof catProfiles.$inferSelect;
export type InsertCatProfile = typeof catProfiles.$inferInsert;

export const translations = mysqlTable("translations", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  catProfileId: bigint("catProfileId", { mode: "number", unsigned: true }).references(
    () => catProfiles.id
  ),
  audioUrl: varchar("audioUrl", { length: 500 }),
  primaryEmotion: mysqlEnum("primaryEmotion", [...emotionEnum]).notNull(),
  intensity: mysqlEnum("intensity", [...intensityEnum]).notNull(),
  urgency: mysqlEnum("urgency", [...urgencyEnum]).notNull(),
  context: mysqlEnum("context", [...contextEnum]),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }),
  secondarySignals: json("secondarySignals").$type<{
    tail?: string;
    ears?: string;
    body?: string;
  }>(),
  suggestedAction: varchar("suggestedAction", { length: 500 }),
  durationMs: int("durationMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = typeof translations.$inferInsert;

export const humanToCatTranslations = mysqlTable("humanToCatTranslations", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  inputText: varchar("inputText", { length: 500 }).notNull(),
  detectedLanguage: varchar("detectedLanguage", { length: 10 }),
  mappedIntent: varchar("mappedIntent", { length: 100 }),
  outputAudioUrl: varchar("outputAudioUrl", { length: 500 }),
  outputEmotion: mysqlEnum("outputEmotion", [...emotionEnum]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HumanToCatTranslation = typeof humanToCatTranslations.$inferSelect;
export type InsertHumanToCatTranslation = typeof humanToCatTranslations.$inferInsert;

export const trainingSamples = mysqlTable("trainingSamples", {
  id: serial("id").primaryKey(),
  translationId: bigint("translationId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => translations.id),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  isAccurate: boolean("isAccurate").notNull(),
  correctedEmotion: varchar("correctedEmotion", { length: 50 }),
  notes: varchar("notes", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingSample = typeof trainingSamples.$inferSelect;
export type InsertTrainingSample = typeof trainingSamples.$inferInsert;

export const userSettings = mysqlTable("userSettings", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .unique()
    .references(() => users.id),
  defaultCatProfileId: bigint("defaultCatProfileId", {
    mode: "number",
    unsigned: true,
  }).references(() => catProfiles.id),
  audioSensitivity: int("audioSensitivity").default(50).notNull(),
  languagePreference: varchar("languagePreference", { length: 10 }).default("en"),
  privacyMode: boolean("privacyMode").default(true).notNull(),
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
