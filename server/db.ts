import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, LedgerEvent, InsertLedgerEvent, MerkleProof, InsertMerkleProof, ChainAnchor, InsertChainAnchor, ledgerEvents, merkleProofs, chainAnchors } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Ledger Queries
export async function appendLedgerEvent(event: InsertLedgerEvent): Promise<LedgerEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(ledgerEvents).values(event);
  const inserted = await db.select().from(ledgerEvents).where(eq(ledgerEvents.hash, event.hash)).limit(1);
  if (!inserted.length) throw new Error("Failed to insert ledger event");
  return inserted[0];
}

export async function getLedgerHistory(limit: number = 100, offset: number = 0, filters?: { decision?: string; omegaMin?: number; omegaMax?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(ledgerEvents);
  
  if (filters?.decision) {
    query = query.where(eq(ledgerEvents.decision, filters.decision)) as any;
  }
  
  return query.orderBy(desc(ledgerEvents.createdAt)).limit(limit).offset(offset);
}

export async function getLastLedgerHash(): Promise<string> {
  const db = await getDb();
  if (!db) return "0".repeat(64);
  
  const result = await db.select().from(ledgerEvents).orderBy(desc(ledgerEvents.createdAt)).limit(1);
  return result.length > 0 ? result[0].hash : "0".repeat(64);
}

// Merkle Proof Queries
export async function saveMerkleProof(proof: InsertMerkleProof): Promise<MerkleProof> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(merkleProofs).values(proof);
  const result = await db.select().from(merkleProofs).where(eq(merkleProofs.merkleRoot, proof.merkleRoot)).limit(1);
  if (!result.length) throw new Error("Failed to insert merkle proof");
  return result[0];
}

export async function getMerkleProof(merkleRoot: string): Promise<MerkleProof | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(merkleProofs).where(eq(merkleProofs.merkleRoot, merkleRoot)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Chain Anchor Queries
export async function saveChainAnchor(anchor: InsertChainAnchor): Promise<ChainAnchor> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(chainAnchors).values(anchor);
  const result = await db.select().from(chainAnchors).where(eq(chainAnchors.merkleRoot, anchor.merkleRoot)).limit(1);
  if (!result.length) throw new Error("Failed to insert chain anchor");
  return result[0];
}

export async function getChainAnchor(merkleRoot: string): Promise<ChainAnchor | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(chainAnchors).where(eq(chainAnchors.merkleRoot, merkleRoot)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateChainAnchorStatus(merkleRoot: string, status: string, txHash?: string, blockNumber?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updates: any = { status };
  if (txHash) updates.txHash = txHash;
  if (blockNumber) updates.blockNumber = blockNumber;
  if (status === "CONFIRMED") updates.confirmedAt = new Date();
  
  await db.update(chainAnchors).set(updates).where(eq(chainAnchors.merkleRoot, merkleRoot));
}
