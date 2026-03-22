/**
 * wallet.ts — Freighter wallet integration utilities.
 *
 * Calls window.freighter directly — the global injected by the Freighter
 * browser extension — instead of importing @stellar/freighter-api.
 * This avoids the package's module-init side effects that try to connect
 * to MetaMask when Freighter is not installed.
 *
 * Falls back to demo mode (DEMO_PUBLIC_KEY) when the extension is absent.
 */

export interface WalletInfo {
  publicKey: string;
  isCorrectNetwork: boolean;
}

// Minimal shape of the window.freighter global injected by the extension
interface FreighterGlobal {
  isConnected: () => Promise<boolean | { isConnected: boolean }>;
  requestAccess?: () => Promise<void>;
  getPublicKey?: () => Promise<string>;
  getAddress?: () => Promise<{ address: string }>;
  getNetworkDetails?: () => Promise<{ networkPassphrase?: string }>;
  signTransaction?: (
    xdr: string,
    opts: { networkPassphrase: string },
  ) => Promise<string | { signedTxXdr: string }>;
}

const DEMO_PUBLIC_KEY = 'GDEMO7STELLAR7HABITS7TRACKER7PUBLICKEY7GABCDEFGHIJKLMNOP';
const EXPECTED_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015';

function getFreighter(): FreighterGlobal | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).freighter ?? null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Called on mount to silently restore an existing Freighter session. */
export async function checkExistingConnection(): Promise<string | null> {
  const freighter = getFreighter();
  if (!freighter) return null;
  try {
    const result = await freighter.isConnected();
    const connected =
      typeof result === 'boolean' ? result : result?.isConnected;
    if (!connected) return null;

    if (freighter.getAddress) {
      const res = await freighter.getAddress();
      return res?.address ?? null;
    }
    return (await freighter.getPublicKey?.()) ?? null;
  } catch {
    return null;
  }
}

/**
 * Called when the user clicks "Connect Wallet".
 * Falls back to demo mode when Freighter extension is not installed.
 */
export async function connectFreighter(): Promise<WalletInfo> {
  const freighter = getFreighter();

  // ── Demo mode ──────────────────────────────────────────────────────────────
  if (!freighter) {
    return { publicKey: DEMO_PUBLIC_KEY, isCorrectNetwork: true };
  }

  // ── Real Freighter ─────────────────────────────────────────────────────────
  try {
    if (freighter.requestAccess) {
      await freighter.requestAccess();
    }

    let publicKey: string;
    if (freighter.getAddress) {
      const res = await freighter.getAddress();
      publicKey = res?.address ?? DEMO_PUBLIC_KEY;
    } else {
      publicKey = (await freighter.getPublicKey?.()) ?? DEMO_PUBLIC_KEY;
    }

    let isCorrectNetwork = true;
    try {
      const details = await freighter.getNetworkDetails?.();
      if (details?.networkPassphrase) {
        isCorrectNetwork = details.networkPassphrase === EXPECTED_PASSPHRASE;
      }
    } catch {
      /* best-effort */
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
  const freighter = getFreighter();
  if (!freighter?.signTransaction) return xdr;
  try {
    const result = await freighter.signTransaction(xdr, opts);
    return typeof result === 'string' ? result : result?.signedTxXdr ?? xdr;
  } catch {
    return xdr;
  }
}
