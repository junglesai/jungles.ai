import { Wallet } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export function WalletConnect() {
  const { connected, publicKey, balance, connect, disconnect } = useWallet();

  return (
    <div className="relative">
      {connected ? (
        <button
          onClick={disconnect}
          className="flex items-center space-x-2 px-3 py-2 bg-yellowgreen-100 text-black rounded-lg hover:bg-yellowgreen-600 transition-colors"
        >
          <Wallet className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">
            {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
          </span>
          <span className="hidden sm:inline text-sm text-black">{balance} SOL</span>
        </button>
      ) : (
        <button
          onClick={connect}
          className="flex items-center space-x-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors wallet-connect-button"
        >
          <Wallet className="w-5 h-5" />
          <span className="hidden sm:inline">Connect Wallet</span>
        </button>
      )}
    </div>
  );
}