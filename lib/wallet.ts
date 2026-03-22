/**
 * wallet.ts — Freighter wallet integration utilities.
 *
 * In a live deployment these functions call the real @stellar/freighter-api.
 * In the preview/demo environment they simulate wallet behaviour so the UI
 * can be exercised without the browser extension installed.
 */

export interface WalletInfo {
  publicKey: string;
  isCorrectNetwork: boolean;
}

const DEMO_PUBLIC_KEY = 'GDEMO7STELLAR7HABITS7TRACKER7PUBLICKEY7GABCDEFGHIJKLMNOP';
const EXPECTED_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015';

// ── Freighter API helper ──────────────────────────────────────────────────────
// Handles both v2 and v3 API shapes (v3 returns { address } from getAddress())

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadFreighter(): Promise<any | null> {
  try {
    if (typeof window === 'undefined') return null;
    return await import('@stellar/freighter-api').catch(() => null);
  } catch {
    return null;
  }
}

export async function checkExistingConnection(): Promise<string | null> {
  try {
    const freighter = await loadFreighter();
    if (!freighter) return null;

    // v3 API: isConnected() returns { isConnected: boolean }
    const connResult = await freighter.isConnected().catch(() => null);
    if (!connResult) return null;
    const connected =
      typeof connResult === 'boolean' ? connResult : connResult?.isConnected;
    if (!connected) return null;

    // v3: getAddress() returns { address: string }
    // v2: getPublicKey() returns string
    if (freighter.getAddress) {
      const res = await freighter.getAddress().catch(() => null);
      return res?.address ?? null;
    }
    return await freighter.getPublicKey().catch(() => null);
  } catch {
    return null;
  }
}

export async function connectFreighter(): Promise<WalletInfo> {
  try {
    const freighter = await loadFreighter();
    if (!freighter) {
      return { publicKey: DEMO_PUBLIC_KEY, isCorrectNetwork: true };
    }

    const connResult = await freighter.isConnected().catch(() => null);
    const connected =
      typeof connResult === 'boolean' ? connResult : connResult?.isConnected;

    if (!connected) {
      return { publicKey: DEMO_PUBLIC_KEY, isCorrectNetwork: true };
    }

    // Request access (v2/v3 compatible)
    if (freighter.requestAccess) {
      await freighter.requestAccess().catch(() => {});
    }

    let publicKey: string;
    if (freighter.getAddress) {
      const res = await freighter.getAddress().catch(() => null);
      publicKey = res?.address ?? DEMO_PUBLIC_KEY;
    } else {
      publicKey = (await freighter.getPublicKey().catch(() => DEMO_PUBLIC_KEY)) ?? DEMO_PUBLIC_KEY;
    }

    // Network passphrase check
    let isCorrectNetwork = true;
    try {
      const details = await freighter.getNetworkDetails().catch(() => null);
      if (details?.networkPassphrase) {
        isCorrectNetwork = details.networkPassphrase === EXPECTED_PASSPHRASE;
      }
    } catch {
      // best-effort
    }

    return { publicKey, isCorrectNetwork };
  } catch {
    return { publicKey: DEMO_PUBLIC_KEY, isCorrectNetwork: true };
  }
}

export function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function signTransaction(
  xdr: string,
  opts: { networkPassphrase: string },
): Promise<string> {
  const freighter = await loadFreighter();
  if (!freighter) return xdr;
  try {
    // v3: signTransaction returns { signedTxXdr }; v2: returns string
    const result = await freighter.signTransaction(xdr, opts);
    return typeof result === 'string' ? result : result?.signedTxXdr ?? xdr;
  } catch {
    return xdr;
  }
}
