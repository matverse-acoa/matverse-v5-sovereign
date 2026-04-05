import { sha256 } from "./crypto";
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
}

const THETA_0 = 100.0;
const OMEGA_THRESHOLD = 0.85;

function normalizeTheta(theta: number): number {
  return 1 / (1 + theta / THETA_0);
}

export function computeOmega(metrics: OmegaMetrics): number {
  const thetaHat = normalizeTheta(metrics.theta);
  let omega =
    0.4 * metrics.psi +
    0.3 * thetaHat +
    0.2 * (1 - metrics.cvar) +
    0.1 * metrics.pole;

  if (metrics.pole === 0) {
    omega *= 0.9;
  }

  return Math.min(1.0, Math.max(0.0, omega));
}

export async function evaluateOmegaGate(
  metrics: OmegaMetrics
): Promise<OmegaDecision> {
  const omega = computeOmega(metrics);
  const decision = omega >= OMEGA_THRESHOLD ? "PASS" : "BLOCK";
  const timestamp = Date.now();

  const data = JSON.stringify({
    omega: Math.round(omega * 1000),
    decision,
    psi: Math.round(metrics.psi * 1000),
    theta: metrics.theta,
    cvar: Math.round(metrics.cvar * 1000),
    pole: metrics.pole,
    timestamp,
  });

  const hash = sha256(data);

  const prevHash = await getLastLedgerHash();
  await appendLedgerEvent({
    hash,
    prevHash,
    psi: Math.round(metrics.psi * 1000),
    theta: metrics.theta,
    cvar: Math.round(metrics.cvar * 1000),
    pole: metrics.pole,
    omega: Math.round(omega * 1000),
    decision,
  });

  return {
    omega,
    decision,
    metrics,
    hash,
    timestamp,
  };
}
