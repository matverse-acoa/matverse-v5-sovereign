/**
 * Replay Engine - Pipeline Π = L ∘ Ω ∘ A ∘ M ∘ E ∘ O ∘ I
 *
 * Replay is read-only. It never calls the mutating Ω-GATE submission function,
 * never appends to the ledger, and never submits a blockchain transaction.
 */

import { and, asc, desc, gte, lt, lte } from "drizzle-orm";
import { ledgerEvents } from "../drizzle/schema";
import { getChainAnchor, getDb } from "./db";
import { computeMerkleRoot, LedgerEventHashPayload, serializeLedgerEventPayload, sha256 } from "./crypto";
import { computeOmega, OMEGA_THRESHOLD, OmegaMetrics } from "./omega-gate";
import { verifyAnchor } from "./web3-anchor";

export interface ReplayInput {
  startEventId?: number;
  endEventId?: number;
  targetMetrics?: OmegaMetrics;
  verifyIntegrity?: boolean;
}

export interface ReplayState {
  eventId: number;
  hash: string;
  prevHash: string;
  hashVersion: number;
  hashPayload: string | null;
  metrics: OmegaMetrics;
  decision: { omega: number; decision: "PASS" | "BLOCK" };
  merkleRoot: string;
  timestamp: Date;
  gatePassed?: boolean;
}

export type EventIntegrityStatus = "VALID" | "INVALID" | "UNVERIFIABLE_LEGACY";
export type ReplayIntegrityStatus = "VERIFIED" | "INVALID" | "UNVERIFIABLE_LEGACY" | "SKIPPED";

export interface ReplayResult {
  success: boolean;
  states: ReplayState[];
  finalMerkleRoot: string;
  integrityVerified: boolean;
  integrityStatus: ReplayIntegrityStatus;
  legacyUnverifiableCount: number;
  anchorStatus: "NOT_SUBMITTED";
  executionTime: number;
  message: string;
}

interface ReplayBatch {
  states: ReplayState[];
  firstExpectedPrevHash: string;
}

interface ObservationResult {
  status: ReplayIntegrityStatus;
  legacyUnverifiableCount: number;
  message?: string;
}

const GENESIS_HASH = "0".repeat(64);

function eventPayloadFromState(
  state: ReplayState,
  nonce: string,
  timestamp: number
): LedgerEventHashPayload {
  return {
    cvar: Math.round(state.metrics.cvar * 1000),
    decision: state.decision.decision,
    nonce,
    omega: Math.round(state.decision.omega * 1000),
    pole: state.metrics.pole,
    prevHash: state.prevHash,
    psi: Math.round(state.metrics.psi * 1000),
    theta: state.metrics.theta,
    timestamp,
  };
}

/** New v2 events are re-hashed; v1 events remain explicitly unverifiable. */
export function verifyReplayEventHash(state: ReplayState): EventIntegrityStatus {
  if (state.hashVersion < 2 || !state.hashPayload) return "UNVERIFIABLE_LEGACY";

  try {
    const parsed = JSON.parse(state.hashPayload) as Partial<LedgerEventHashPayload>;
    if (typeof parsed.nonce !== "string" || !Number.isFinite(parsed.timestamp)) return "INVALID";

    const expectedPayload = eventPayloadFromState(state, parsed.nonce, parsed.timestamp as number);
    const canonicalStoredPayload = serializeLedgerEventPayload(parsed as LedgerEventHashPayload);
    if (canonicalStoredPayload !== state.hashPayload) return "INVALID";
    if (serializeLedgerEventPayload(expectedPayload) !== state.hashPayload) return "INVALID";
    return sha256(state.hashPayload) === state.hash ? "VALID" : "INVALID";
  } catch {
    return "INVALID";
  }
}

/** Pure replay evaluation: unlike evaluateOmegaGate, this function never writes to the ledger. */
export function evaluateReplayDecision(metrics: OmegaMetrics): { omega: number; decision: "PASS" | "BLOCK" } {
  const omega = computeOmega(metrics);
  return { omega, decision: omega >= OMEGA_THRESHOLD ? "PASS" : "BLOCK" };
}

async function stageI_Input(startId?: number, endId?: number): Promise<ReplayBatch> {
  const lower = startId ?? 1;
  const upper = endId ?? 2147483647;
  if (!Number.isInteger(lower) || lower < 1 || !Number.isInteger(upper) || upper < lower) {
    throw new RangeError("Replay event range must contain positive, ordered integer IDs");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select()
    .from(ledgerEvents)
    .where(and(gte(ledgerEvents.id, lower), lte(ledgerEvents.id, upper)))
    .orderBy(asc(ledgerEvents.id));

  const previousRows = lower > 1
    ? await db
        .select({ hash: ledgerEvents.hash })
        .from(ledgerEvents)
        .where(lt(ledgerEvents.id, lower))
        .orderBy(desc(ledgerEvents.id))
        .limit(1)
    : [];

  const states: ReplayState[] = rows.map((event) => {
    let timestamp = new Date(event.createdAt);
    if (event.hashVersion >= 2 && event.hashPayload) {
      try {
        const payload = JSON.parse(event.hashPayload) as { timestamp?: number };
        if (typeof payload.timestamp === "number" && Number.isFinite(payload.timestamp)) {
          timestamp = new Date(payload.timestamp);
        }
      } catch {
        // Integrity verification will classify malformed v2 payloads as INVALID.
      }
    }
    return {
      eventId: event.id,
      hash: event.hash,
      prevHash: event.prevHash,
      hashVersion: event.hashVersion ?? 1,
      hashPayload: event.hashPayload ?? null,
      metrics: {
        psi: event.psi / 1000,
        theta: event.theta,
        cvar: event.cvar / 1000,
        pole: event.pole,
      },
      decision: {
        omega: event.omega / 1000,
        decision: event.decision === "PASS" ? "PASS" : "BLOCK",
      },
      merkleRoot: event.merkleRoot || "",
      timestamp,
    };
  });

  return {
    states,
    firstExpectedPrevHash: previousRows[0]?.hash ?? GENESIS_HASH,
  };
}

async function stageO_Observation(
  states: ReplayState[],
  firstExpectedPrevHash: string
): Promise<ObservationResult> {
  let legacyUnverifiableCount = 0;

  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    const expectedPrevHash = i === 0 ? firstExpectedPrevHash : states[i - 1].hash;
    if (state.prevHash !== expectedPrevHash) {
      return {
        status: "INVALID",
        legacyUnverifiableCount,
        message: `Chain link mismatch at event ${state.eventId}`,
      };
    }

    const eventStatus = verifyReplayEventHash(state);
    if (eventStatus === "INVALID") {
      return {
        status: "INVALID",
        legacyUnverifiableCount,
        message: `Event hash/payload mismatch at event ${state.eventId}`,
      };
    }
    if (eventStatus === "UNVERIFIABLE_LEGACY") legacyUnverifiableCount++;
  }

  return {
    status: legacyUnverifiableCount > 0 ? "UNVERIFIABLE_LEGACY" : "VERIFIED",
    legacyUnverifiableCount,
  };
}

function stageE_Evaluation(states: ReplayState[]): ReplayState[] {
  return states.map((state) => ({
    ...state,
    decision: evaluateReplayDecision(state.metrics),
  }));
}

function stageM_Merkle(states: ReplayState[]): ReplayState[] {
  const merkleRoot = computeMerkleRoot(states.map((state) => state.hash));
  return states.map((state) => ({ ...state, merkleRoot }));
}

function stageA_Anchor(states: ReplayState[]): ReplayState[] {
  // Merkle root is prepared locally. No network submission occurs in replay.
  return states;
}

function stageOmega_Gate(states: ReplayState[]): ReplayState[] {
  // Preserve BLOCK states as negative evidence; annotate rather than filter.
  return states.map((state) => ({
    ...state,
    gatePassed: state.decision.decision === "PASS" && state.decision.omega >= OMEGA_THRESHOLD,
  }));
}

function stageL_Ledger(states: ReplayState[]): ReplayState[] {
  // Read-only replay: no ledger writes or acknowledgements.
  return states;
}

function failureResult(
  startTime: number,
  message: string,
  states: ReplayState[] = [],
  finalMerkleRoot = "",
  integrityStatus: ReplayIntegrityStatus = "INVALID",
  legacyUnverifiableCount = 0
): ReplayResult {
  return {
    success: false,
    states,
    finalMerkleRoot,
    integrityVerified: false,
    integrityStatus,
    legacyUnverifiableCount,
    anchorStatus: "NOT_SUBMITTED",
    executionTime: Date.now() - startTime,
    message,
  };
}

export async function executeReplayPipeline(input: ReplayInput): Promise<ReplayResult> {
  const startTime = Date.now();

  try {
    const batch = await stageI_Input(input.startEventId, input.endEventId);
    const inputStates = batch.states;
    if (inputStates.length === 0) {
      return failureResult(startTime, "No events found in specified range", [], "", "SKIPPED");
    }

    const finalMerkleRoot = computeMerkleRoot(inputStates.map((state) => state.hash));
    let integrityStatus: ReplayIntegrityStatus = "SKIPPED";
    let legacyUnverifiableCount = 0;

    if (input.verifyIntegrity !== false) {
      const observation = await stageO_Observation(inputStates, batch.firstExpectedPrevHash);
      integrityStatus = observation.status;
      legacyUnverifiableCount = observation.legacyUnverifiableCount;

      if (observation.status === "INVALID") {
        return failureResult(
          startTime,
          observation.message || "Replay integrity verification failed",
          inputStates,
          finalMerkleRoot,
          "INVALID",
          legacyUnverifiableCount
        );
      }
      if (observation.status === "UNVERIFIABLE_LEGACY") {
        return failureResult(
          startTime,
          `Replay contains ${legacyUnverifiableCount} legacy event(s) without persisted hash payload; integrity cannot be certified.`,
          inputStates,
          finalMerkleRoot,
          "UNVERIFIABLE_LEGACY",
          legacyUnverifiableCount
        );
      }
    }

    let states = stageE_Evaluation(inputStates);
    states = stageM_Merkle(states);
    states = stageA_Anchor(states);
    states = stageOmega_Gate(states);
    states = stageL_Ledger(states);

    return {
      success: true,
      states,
      finalMerkleRoot,
      integrityVerified: integrityStatus === "VERIFIED",
      integrityStatus,
      legacyUnverifiableCount,
      anchorStatus: "NOT_SUBMITTED",
      executionTime: Date.now() - startTime,
      message: input.verifyIntegrity === false
        ? `Replay completed for ${states.length} events; integrity verification was explicitly skipped and no chain transaction was submitted.`
        : `Replay completed for ${states.length} events; all states, including BLOCK decisions, were preserved. No chain transaction was submitted.`,
    };
  } catch (error) {
    return failureResult(
      startTime,
      `Replay failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      [],
      "",
      "INVALID"
    );
  }
}

/** True only when a stored anchor is confirmed and its transaction commits this exact root. */
export async function verifyReplayAgainstChain(merkleRoot: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(merkleRoot)) return false;
  try {
    const anchor = await getChainAnchor(merkleRoot);
    if (!anchor || anchor.status !== "CONFIRMED" || !anchor.txHash) return false;
    const verified = await verifyAnchor(anchor.txHash, merkleRoot);
    return verified?.status === "CONFIRMED";
  } catch {
    return false;
  }
}
