import crypto from "crypto";

export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export interface LedgerEventHashPayload {
  cvar: number;
  decision: "PASS" | "BLOCK";
  nonce: string;
  omega: number;
  pole: number;
  prevHash: string;
  psi: number;
  theta: number;
  timestamp: number;
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function serializeLedgerEventPayload(payload: LedgerEventHashPayload): string {
  return canonicalJson(payload);
}

export function hashLedgerEvent(payload: LedgerEventHashPayload): string {
  return sha256(serializeLedgerEventPayload(payload));
}

export function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return "0".repeat(64);
  if (hashes.length === 1) return hashes[0];

  let currentLevel = [...hashes];
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || currentLevel[i];
      nextLevel.push(sha256(left + right));
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}

export function getMerkleProofPath(hashes: string[], index: number): string[] {
  if (!Number.isInteger(index) || index < 0 || index >= hashes.length) {
    throw new RangeError("Merkle leaf index is outside the tree");
  }

  const path: string[] = [];
  let currentIndex = index;
  let currentLevel = [...hashes];

  while (currentLevel.length > 1) {
    const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
    path.push(currentLevel[siblingIndex] ?? currentLevel[currentIndex]);

    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || currentLevel[i];
      nextLevel.push(sha256(left + right));
    }
    currentIndex = Math.floor(currentIndex / 2);
    currentLevel = nextLevel;
  }
  return path;
}

export function verifyMerkleProof(
  leaf: string,
  proof: string[],
  root: string,
  leafIndex = 0
): boolean {
  if (!Number.isInteger(leafIndex) || leafIndex < 0) return false;

  let current = leaf;
  let index = leafIndex;
  for (const sibling of proof) {
    current = index % 2 === 0 ? sha256(current + sibling) : sha256(sibling + current);
    index = Math.floor(index / 2);
  }
  return current === root;
}
