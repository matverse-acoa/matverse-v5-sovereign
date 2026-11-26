import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Ledger Imutável (Append-Only)
export const ledgerEvents = mysqlTable("ledger_events", {
  id: int("id").autoincrement().primaryKey(),
  hash: varchar("hash", { length: 64 }).notNull().unique(),
  hashVersion: int("hashVersion").notNull().default(1), // 1 = legacy; 2 = canonical persisted payload
  hashPayload: text("hashPayload"), // Canonical JSON used to compute the v2 event hash
  prevHash: varchar("prevHash", { length: 64 }).notNull(),
  psi: int("psi").notNull(), // Stored as integer (0-1000 = 0.0-1.0)
  theta: int("theta").notNull(), // Latência em ms
  cvar: int("cvar").notNull(), // Stored as integer (0-1000 = 0.0-1.0)
  pole: int("pole").notNull(), // 0 ou 1
  omega: int("omega").notNull(), // Stored as integer (0-1000 = 0.0-1.0)
  decision: varchar("decision", { length: 16 }).notNull(), // PASS ou BLOCK
  merkleRoot: varchar("merkleRoot", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LedgerEvent = typeof ledgerEvents.$inferSelect;
export type InsertLedgerEvent = typeof ledgerEvents.$inferInsert;

// Provas Criptográficas (Merkle Tree)
export const merkleProofs = mysqlTable("merkle_proofs", {
  id: int("id").autoincrement().primaryKey(),
  merkleRoot: varchar("merkleRoot", { length: 64 }).notNull().unique(),
  eventCount: int("eventCount").notNull(),
  proofPath: text("proofPath").notNull(), // JSON array of hashes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MerkleProof = typeof merkleProofs.$inferSelect;
export type InsertMerkleProof = typeof merkleProofs.$inferInsert;

// Ancoragens On-Chain (Sepolia)
export const chainAnchors = mysqlTable("chain_anchors", {
  id: int("id").autoincrement().primaryKey(),
  merkleRoot: varchar("merkleRoot", { length: 64 }).notNull(),
  txHash: varchar("txHash", { length: 66 }),
  blockNumber: int("blockNumber"),
  contractAddress: varchar("contractAddress", { length: 42 }),
  status: varchar("status", { length: 16 }).notNull(), // PENDING, CONFIRMED, FAILED
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
});

export type ChainAnchor = typeof chainAnchors.$inferSelect;
export type InsertChainAnchor = typeof chainAnchors.$inferInsert;