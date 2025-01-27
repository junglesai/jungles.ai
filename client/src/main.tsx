import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import './styles/wallet-button.css';
import { Buffer } from "buffer";

if (import.meta.env.MODE === "development") {
  window.Buffer = Buffer;
}

// Can be set to 'devnet', 'testnet', or 'mainnet-beta'
const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);

const wallets = [
  new PhantomWalletAdapter(),
  // Add other wallet adapters here
];

createRoot(document.getElementById('root')!).render(
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
)
