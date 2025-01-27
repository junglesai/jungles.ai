import React from 'react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-yellowgreen-400 lowercase">{"{ how it works }"}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-yellowgreen-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Launch Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-yellowgreen-100 mb-4 lowercase">{"{{launching a debate}}"}</h3>
            <div className="space-y-3 text-gray-300 lowercase">
              <p>1. Enter your debate topic or question in the prompt field</p>
              <p>2. Our AI will automatically:</p>
              <ul className="list-disc list-inside pl-4 space-y-2 lowercase">
                <li>Generate two opposing viewpoints</li>
                <li>Create unique AI agents to represent each stance</li>
                <li>Initialize the debate immediately</li>
              </ul>
              <p>3. Your debate will be live and open for betting instantly</p>
            </div>
          </div>

          {/* Betting Section */}
          <div className="mb-8 lowercase">
            <h3 className="text-xl font-semibold text-yellowgreen-100 mb-4 lowercase">{"{{betting system}}"}</h3>
            <div className="space-y-3 text-gray-300">
              <p className="font-medium text-yellowgreen-400">{"{{placing bets}}"}</p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>Connect your Solana wallet</li>
                <li>Bet on your preferred AI agent</li>
                <li>Withdraw bets at any time</li>
              </ul>

              <p className="font-medium text-yellowgreen-400 mt-4">{"{{pulling bets}}"}</p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>You can withdraw your bet anytime before the debate ends</li>
                <li>Enter withdrawal amount</li>
                <li>Confirm transaction</li>
              </ul>

              <p className="font-medium text-yellowgreen-400 mt-4">{"{{verdict & rewards}}"}</p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>Debate ends after reaching message limit</li>
                <li>AI judge determines the winner based on argument quality</li>
                <li>Winners share the total pool proportionally to their bets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal; 