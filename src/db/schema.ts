import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  role: text("role").default("INVESTOR").notNull(), // INVESTOR, RESEARCH_ANALYST, ADMINISTRATOR
  passwordHash: text("password_hash"),
  salt: text("salt"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Watchlist Table
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  ipoSymbol: text("ipo_symbol").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bids/Applications Table
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  ipoSymbol: text("ipo_symbol").notNull(),
  ipoName: text("ipo_name").notNull(),
  category: text("category").notNull(), // RETAIL, HNI, QIB, etc.
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default("PENDING").notNull(), // PENDING, ALLOTTED, REJECTED, CANCELLED
  panEncrypted: text("pan_encrypted"),
  appNumEncrypted: text("app_num_encrypted"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" }), // Nullable for global/system alerts
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // GMP_ALERT, ALLOTMENT, SYSTEM, AI_ANALYSIS
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Success Predictions & RHP analysis Table
export const aiPredictions = pgTable("ai_predictions", {
  id: serial("id").primaryKey(),
  ipoSymbol: text("ipo_symbol").notNull().unique(),
  successProbability: integer("success_probability").notNull(), // percentage (e.g. 85)
  expectedListingGain: integer("expected_listing_gain").notNull(), // percentage (e.g. 45)
  confidence: integer("confidence").notNull(), // percentage (e.g. 90)
  detailedAnalysis: text("detailed_analysis").notNull(), // AI detailed review / markdown
  createdAt: timestamp("created_at").defaultNow(),
});

// User Settings Table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull().unique(),
  gmpAlerts: boolean("gmp_alerts").default(true).notNull(),
  allotmentAlerts: boolean("allotment_alerts").default(true).notNull(),
  aiReports: boolean("ai_reports").default(true).notNull(),
  riskAppetite: text("risk_appetite").default("Moderate").notNull(), // Low, Moderate, High
  createdAt: timestamp("created_at").defaultNow(),
});

// Define Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  watchlist: many(watchlist),
  bids: many(bids),
  notifications: many(notifications),
  portfolioHistory: many(portfolioHistory),
  auditLogs: many(auditLogs),
  apiUsageLogs: many(apiUsageLogs),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(users, {
    fields: [watchlist.userId],
    references: [users.id],
  }),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  user: one(users, {
    fields: [bids.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Portfolio History Table
export const portfolioHistory = pgTable("portfolio_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  totalValue: integer("total_value").notNull(), // in rupees/cents
  totalInvested: integer("total_invested").notNull(),
  unrealizedGain: integer("unrealized_gain").notNull(),
  realizedGain: integer("realized_gain").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Historical IPOs Table
export const historicalIpos = pgTable("historical_ipos", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  listingDate: timestamp("listing_date").notNull(),
  issuePrice: integer("issue_price").notNull(),
  listingPrice: integer("listing_price").notNull(),
  currentPrice: integer("current_price").notNull(),
  listingGainPercent: integer("listing_gain_percent").notNull(),
  status: text("status").default("LISTED").notNull(),
  sector: text("sector"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Market Data Table
export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  dataKey: text("data_key").notNull().unique(), // e.g., "NIFTY_50", "SENSEX", etc.
  dataValue: text("data_value").notNull(),
  changePercent: text("change_percent"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit Logs Table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  details: text("details").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API Usage Logs Table
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  endpoint: text("endpoint").notNull(),
  provider: text("provider").notNull(),
  tokensUsed: integer("tokens_used").default(0),
  responseTimeMs: integer("response_time_ms"),
  statusCode: integer("status_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New Relations Definitions
export const portfolioHistoryRelations = relations(portfolioHistory, ({ one }) => ({
  user: one(users, {
    fields: [portfolioHistory.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const apiUsageLogsRelations = relations(apiUsageLogs, ({ one }) => ({
  user: one(users, {
    fields: [apiUsageLogs.userId],
    references: [users.id],
  }),
}));

