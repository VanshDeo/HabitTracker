'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { connectFreighter, checkExistingConnection } from '@/lib/wallet';

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // On mount: silently check if Freighter is already connected
  useEffect(() => {
    checkExistingConnection().then((pk) => {
      if (pk) {
        setPublicKey(pk);
        setIsCorrectNetwork(true);
      }
    });
  }, []);

  const connect = useCallback(async () => {
    const info = await connectFreighter();
    setPublicKey(info.publicKey);
    setIsCorrectNetwork(info.isCorrectNetwork);
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setIsCorrectNetwork(false);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected: !!publicKey,
        isCorrectNetwork,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used inside WalletProvider');
  return ctx;
}
