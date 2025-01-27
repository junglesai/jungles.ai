import { useState, useCallback } from 'react';
import { WalletState } from '../types';
import { connectWallet, disconnectWallet } from '../services/wallet';

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    balance: 0,
  });

  const connect = useCallback(async () => {
    try {
      const { publicKey, balance } = await connectWallet();
      setWalletState({
        connected: true,
        publicKey: publicKey || null,
        balance,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
      setWalletState({
        connected: false,
        publicKey: null,
        balance: 0,
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, []);

  return {
    ...walletState,
    connect,
    disconnect,
  };
}