import crypto from "crypto";
import { hashLedgerEvent, LedgerEventHashPayload, serializeLedgerEventPayload } from "./crypto";
import { getLastLedgerHash, appendLedgerEvent } from "./db";

export interface OmegaMetrics {
  psi: number;
  theta: number;
  cvar: number;
  pole: number;
}

export interface OmegaDecision {
  omega: number;
  decision: "PASS" | "BLOCK";
  metrics: OmegaMetrics;
  hash: string;
  timestamp: number;
  hashVersion: 2;
}

const THETA_0 = 100.0;
export const OMEGA_THRESHOLD = 0.85;

export function validateOmegaMetrics(metrics: OmegaMetrics): void {
  const values = [metrics.psi, metrics.theta, metrics.cvar, metrics.pole];
  if (!values.every(Number.isFinite)) throw new RangeError("Omega metrics must be finite numbers");
  if (metrics.psi < 0 || metrics.psi > 1) throw new RangeError("psi must be between 0 and 1");
  if (!Number.isInteger(metrics.theta) || metrics.theta < 0) {
    throw new RangeError("theta must be a non-negative integer number of milliseconds");
  }
  if (metrics.cvar < 0 || metrics.cvar > 1) throw new RangeError("cvar must be between 0 and 1");
  if (metrics.pole !== 0 && metrics.pole !== 1) throw new RangeError("pole must be either 0 or 1");
}

function normalizeTheta(theta: number): number {
  return 1 / (1 + theta / THETA_0);
}

export function computeOmega(metrics: OmegaMetrics): number {
  validateOmegaMetrics(metrics);
  const thetaHat = normalizeTheta(metrics.theta);
  let omega =
    0.4 * metrics.psi +
    0.3 * thetaHat +
    0.2 * (1 - metrics.cvar) +
    0.1 * metrics.pole;

  if (metrics.pole === 0) omega *= 0.9;
  return Math.min(1.0, Math.max(0.0, omega));
}

export async function evaluateOmegaGate(metrics: OmegaMetrics): Promise<OmegaDecision> {
  const omega = computeOmega(metrics);
  const decision = omega >= OMEGA_THRESHOLD ? "PASS" : "BLOCK";
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const prevHash = await getLastLedgerHash();

  const payload: LedgerEventHashPayload = {
    cvar: Math.round(metrics.cvar * 1000),
    decision,
    nonce,
    omega: Math.round(omega * 1000),
    pole: metrics.pole,
    prevHash,
    psi: Math.round(metrics.psi * 1000),
    theta: metrics.theta,
    timestamp,
  };
  const hashPayload = serializeLedgerEventPayload(payload);
  const hash = hashLedgerEvent(payload);

  await appendLedgerEvent({
    hash,
    prevHash,
    psi: payload.psi,
    theta: payload.theta,
    cvar: payload.cvar,
    pole: payload.pole,
    omega: payload.omega,
    decision,
    hashVersion: 2,
    hashPayload,
  });

  return { omega, decision, metrics, hash, timestamp, hashVersion: 2 };
}
