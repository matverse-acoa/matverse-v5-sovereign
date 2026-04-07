/**
 * Replay Engine - Pipeline Π = L ∘ Ω ∘ A ∘ M ∘ E ∘ O ∘ I
 * 
 * Deterministic state reproduction through immutable ledger and governance chain.
 * All operations are reversible and auditable.
 */

import { getDb } from "./db";
import { evaluateOmegaGate, OmegaMetrics, OmegaDecision } from "./omega-gate";
import { computeMerkleRoot } from "./crypto";
import crypto from "crypto";

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
  metrics: OmegaMetrics;
  decision: { omega: number; decision: string };
  merkleRoot: string;
  timestamp: Date;
}

export interface ReplayResult {
  success: boolean;
  states: ReplayState[];
  finalMerkleRoot: string;
  integrityVerified: boolean;
  executionTime: number;
  message: string;
}

/**
 * Pipeline Stage: I (Input) - Load events from ledger
 */
async function stageI_Input(startId?: number, endId?: number): Promise<ReplayState[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await (db as any).query.ledger_events.findMany({
      limit: 100,
      orderBy: (fields: any) => fields.id,
    });

    return (result as any[]).map((e: any) => ({
      eventId: e.id,
      hash: e.hash,
      prevHash: e.prevHash,
      metrics: {
        psi: e.psi,
        theta: e.theta,
        cvar: e.cvar,
        pole: e.pole,
      },
      decision: { omega: e.omega, decision: e.decision },
      merkleRoot: e.merkleRoot || "",
      timestamp: e.createdAt,
    }));
  } catch (error) {
    console.error("Error loading events:", error);
    return [];
  }
}

/**
 * Pipeline Stage: O (Observation) - Validate event hashes
 */
async function stageO_Observation(states: ReplayState[]): Promise<boolean> {
  for (let i = 0; i < states.length; i++) {
    const state = states[i];

    // Verify hash integrity
    const expectedHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(state.metrics) + state.prevHash)
      .digest("hex");

    if (expectedHash !== state.hash) {
      console.error(`Hash mismatch at event ${state.eventId}`);
      return false;
    }

    // Verify chain continuity
    if (i > 0 && states[i - 1].hash !== state.prevHash) {
      console.error(`Chain break at event ${state.eventId}`);
      return false;
    }
  }

  return true;
}

/**
 * Pipeline Stage: E (Evaluation) - Re-evaluate Ω-GATE decisions
 */
async function stageE_Evaluation(states: ReplayState[]): Promise<ReplayState[]> {
  const evaluated: ReplayState[] = [];

  for (const state of states) {
    const decision = await evaluateOmegaGate(state.metrics);
    evaluated.push({
      ...state,
      decision: { omega: decision.omega, decision: decision.decision },
    });
  }

  return evaluated;
}

/**
 * Pipeline Stage: M (Merkle) - Compute Merkle proofs
 */
async function stageM_Merkle(states: ReplayState[]): Promise<ReplayState[]> {
  const hashes = states.map((s) => s.hash);
  const merkleRoot = computeMerkleRoot(hashes);

  return states.map((state) => ({
    ...state,
    merkleRoot,
  }));
}

/**
 * Pipeline Stage: A (Anchor) - Prepare for on-chain anchoring
 */
async function stageA_Anchor(states: ReplayState[]): Promise<ReplayState[]> {
  // In production, this would prepare data for blockchain submission
  // For now, we just mark as ready
  return states.map((state) => ({
    ...state,
    // merkleRoot already set in stage M
  }));
}

/**
 * Pipeline Stage: Ω (Omega Gate) - Final governance decision
 */
async function stageOmega_Gate(states: ReplayState[]): Promise<ReplayState[]> {
  // All decisions already evaluated in stage E
  // This stage performs final validation
  return states.filter((state) => state.decision.omega >= 85);
}

/**
 * Pipeline Stage: L (Ledger) - Commit to immutable ledger
 */
async function stageL_Ledger(states: ReplayState[]): Promise<ReplayState[]> {
  // In production, this would write back to ledger
  // For replay, we just return the states (read-only)
  return states;
}

/**
 * Execute deterministic replay pipeline
 */
export async function executeReplayPipeline(input: ReplayInput): Promise<ReplayResult> {
  const startTime = Date.now();

  try {
    // Stage I: Input
    const inputStates = await stageI_Input(input.startEventId, input.endEventId);

    if (inputStates.length === 0) {
      return {
        success: false,
        states: [],
        finalMerkleRoot: "",
        integrityVerified: false,
        executionTime: Date.now() - startTime,
        message: "No events found in specified range",
      };
    }

    // Stage O: Observation
    const observationValid = await stageO_Observation(inputStates);
    if (!observationValid) {
      return {
        success: false,
        states: inputStates,
        finalMerkleRoot: "",
        integrityVerified: false,
        executionTime: Date.now() - startTime,
        message: "Observation stage failed: hash or chain integrity violation",
      };
    }

    // Stage E: Evaluation
    let states = await stageE_Evaluation(inputStates);

    // Stage M: Merkle
    states = await stageM_Merkle(states);

    // Stage A: Anchor
    states = await stageA_Anchor(states);

    // Stage Ω: Omega Gate
    states = await stageOmega_Gate(states);

    // Stage L: Ledger
    states = await stageL_Ledger(states);

    const finalMerkleRoot = states.length > 0 ? states[states.length - 1].merkleRoot : "";

    return {
      success: true,
      states,
      finalMerkleRoot,
      integrityVerified: input.verifyIntegrity ? observationValid : false,
      executionTime: Date.now() - startTime,
      message: `Replay completed: ${states.length} states processed`,
    };
  } catch (error) {
    return {
      success: false,
      states: [],
      finalMerkleRoot: "",
      integrityVerified: false,
      executionTime: Date.now() - startTime,
      message: `Replay failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Verify replay result against on-chain anchor
 */
export async function verifyReplayAgainstChain(merkleRoot: string): Promise<boolean> {
  // In production, would verify against actual blockchain
  // For now, just validate format
  return /^[a-f0-9]{64}$/.test(merkleRoot);
}
