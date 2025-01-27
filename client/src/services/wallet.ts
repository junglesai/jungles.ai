import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Use a public RPC endpoint that supports CORS
const RPC_URL = "https://devnet.helius-rpc.com/?api-key=068182b0-c7ae-497a-821f-88c78e1b1bd7";
const connection = new Connection(RPC_URL, 'confirmed');
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
