import { ethers } from "ethers";

const SEPOLIA_CHAIN_ID = BigInt(11155111);

export interface AnchorAuthorization {
  approved: boolean;
  network: "sepolia";
}

export interface AnchorResult {
  txHash: string;
  blockNumber?: number;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  timestamp: number;
  reason?: string;
}

function failed(reason: string): AnchorResult {
  return { txHash: "", status: "FAILED", timestamp: Date.now(), reason };
}

function validRoot(root: string): boolean {
  return /^[a-f0-9]{64}$/i.test(root);
}

export async function anchorMerkleRoot(
  merkleRoot: string,
  privateKey: string,
  authorization: AnchorAuthorization
): Promise<AnchorResult> {
  if (
    authorization?.approved !== true ||
    authorization.network !== "sepolia" ||
    process.env.MATVERSE_ALLOW_EXTERNAL_ANCHOR !== "true"
  ) {
    return failed("external_submission_not_authorized");
  }
  if (!validRoot(merkleRoot)) return failed("invalid_merkle_root");

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) return failed("SEPOLIA_RPC_URL_not_configured");

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) return failed("wrong_chain");

    const wallet = new ethers.Wallet(privateKey, provider);
    const data = `0x${merkleRoot.toLowerCase()}`;
    const transaction = { from: wallet.address, to: wallet.address, value: 0, data };
    const estimatedGas = await provider.estimateGas(transaction);
    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0,
      data,
      gasLimit: estimatedGas + estimatedGas / BigInt(5),
    });
    return { txHash: tx.hash, status: "PENDING", timestamp: Date.now() };
  } catch {
    return failed("anchor_submission_failed");
  }
}

export async function verifyAnchor(
  txHash: string,
  expectedMerkleRoot: string
): Promise<AnchorResult | null> {
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash) || !validRoot(expectedMerkleRoot)) return null;
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) return null;

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) return failed("wrong_chain");

    const [receipt, transaction] = await Promise.all([
      provider.getTransactionReceipt(txHash),
      provider.getTransaction(txHash),
    ]);
    if (!receipt || !transaction) return { txHash, status: "PENDING", timestamp: Date.now() };

    const expectedData = `0x${expectedMerkleRoot.toLowerCase()}`;
    const payloadMatches =
      transaction.to?.toLowerCase() === transaction.from.toLowerCase() &&
      transaction.data.toLowerCase() === expectedData;

    if (receipt.status !== 1 || !payloadMatches) {
      return {
        txHash,
        blockNumber: receipt.blockNumber,
        status: "FAILED",
        timestamp: Date.now(),
        reason: "transaction_does_not_commit_expected_merkle_root",
      };
    }
    return { txHash, blockNumber: receipt.blockNumber, status: "CONFIRMED", timestamp: Date.now() };
  } catch {
    return null;
  }
}
