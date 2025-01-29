import React, {useState} from 'react';
import axios from 'axios';
import { initializeDebateOnChain } from '../utils/programUtils';
import { useWallet } from "@solana/wallet-adapter-react";
import {
    WalletMultiButton,
    useWalletModal,
  } from "@solana/wallet-adapter-react-ui";
import Toast, { ToastType } from './Toast';
import { Connection } from '@solana/web3.js';

interface LaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Sparkle icon component
const SparkleIcon = () => (
  <svg 
    className="w-6 h-6" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

const LaunchModal: React.FC<LaunchModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { setVisible, visible } = useWalletModal();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [prompt, setPrompt] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!connected || !publicKey) {
        setVisible(true);
        return;
      }

    try {
        const mode = import.meta.env.VITE_MODE;
        const connection = new Connection(mode === 'dev' ? import.meta.env.VITE_SOLANA_DEVNET_RPC_URL : import.meta.env.VITE_SOLANA_MAINNET_RPC_URL);
       const onChainDebate = await initializeDebateOnChain(connection, publicKey, sendTransaction);
       if (!onChainDebate) {
        console.error('Error initializing debate on chain');
        setToast({
          message: 'Error initializing debate on chain',
          type: 'error',
        });
        return;
       }

     const { signature, debateAddress, agent1, agent2 } = onChainDebate;
     const response = await axios.post('/api/debates/create', { signature, debateAddress, agent1, agent2, prompt });

     setPrompt('');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating debate:', error);
      setToast({
        message: 'Error creating debate',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-lg">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-300 lowercase"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Content */}
          <div className="mt-3 sm:mt-0">
            <h3 className="text-lg font-medium leading-6 text-white mb-4 flex sm:justify-start justify-center items-center gap-2 lowercase">
             {"{"} <SparkleIcon /> launch new debate {"}"}
            </h3>
            <p className="text-sm text-gray-400 mb-4 sm:text-left text-center lowercase">
              Describe your debate and we'll generate it using AI.
            </p>
            <form onSubmit={handleSubmit}>
              <textarea
                rows={4}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-yellowgreen-400 transition-colors"
                placeholder="Enter your debate topic..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="mt-4 flex sm:justify-end justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors lowercase"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                {connected && publicKey ? (
                <button
                  type="submit"
                  disabled={!prompt.trim() || isSubmitting}
                  className="px-6 py-2 bg-yellowgreen-400 hover:bg-yellowgreen-100 text-gray-900 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed lowercase"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900" />
                  ) : (
                    <SparkleIcon />
                  )}
                  {isSubmitting ? 'Creating...' : 'Launch Debate'}
                </button>
                ) : (
                  <WalletMultiButton />
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default LaunchModal; 