import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { Connection } from '@solana/web3.js';

const mode = import.meta.env.VITE_MODE;
const connection = new Connection(mode === 'dev' ? import.meta.env.VITE_SOLANA_DEVNET_RPC_URL : import.meta.env.VITE_SOLANA_MAINNET_RPC_URL, 'confirmed');
const wallet = new PhantomWalletAdapter();

export const connectWallet = async () => {
  try {
    await wallet.connect();
    const balance = await connection.getBalance(wallet.publicKey!);
    return {
      publicKey: wallet.publicKey?.toString(),
      balance: balance / 1e9, // Convert lamports to SOL
    };

  } catch (error) {
    console.error('Wallet connection error:', error);
    throw error;
  }
};

export const disconnectWallet = async () => {
  try {
    await wallet.disconnect();
  } catch (error) {
    console.error('Wallet disconnection error:', error);
    throw error;
  }
};
