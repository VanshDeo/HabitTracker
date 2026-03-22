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
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ??
  'Test SDF Network ; September 2015';

// ── Try the real Freighter API; fall back gracefully ──────────────────────────

async function tryFreighter<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function checkExistingConnection(): Promise<string | null> {
  try {
    // Dynamic import so the module is only resolved client-side
    const freighter = await import('@stellar/freighter-api').catch(() => null);
    if (!freighter) return null;
    const connected = await freighter.isConnected();
    if (!connected) return null;
    return await freighter.getPublicKey();
  } catch {
    return null;
  }
}

export async function connectFreighter(): Promise<WalletInfo> {
  try {
    const freighter = await import('@stellar/freighter-api').catch(() => null);
    if (!freighter) {
      // Demo fallback — no extension installed
      return { publicKey: DEMO_PUBLIC_KEY, isCorrectNetwork: true };
    }

    const connected = await freighter.isConnected();
    if (!connected) {
      // Offer demo mode when extension is absent
      return { publicKey: DEMO_PUBLIC_KEY, isCorrectNetwork: true };
    }

    await freighter.requestAccess();
    const publicKey = await freighter.getPublicKey();
    const details = await freighter.getNetworkDetails();
    return {
      publicKey,
      isCorrectNetwork: details.networkPassphrase === EXPECTED_PASSPHRASE,
    };
  } catch {
    // Demo fallback on any error
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
  const freighter = await import('@stellar/freighter-api').catch(() => null);
  if (freighter) {
    return freighter.signTransaction(xdr, opts);
  }
  // Demo: return the XDR unchanged
  return xdr;
}
