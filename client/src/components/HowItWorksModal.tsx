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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-yellowgreen-100 lowercase">{"{ how it works }"}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-yellowgreen-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <hr className="w-full border-yellowgreen-100"/>

          {/* Table of Contents */}
          <div className="my-4 p-4 bg-gray-900/50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellowgreen-100 mb-3 lowercase">{"{{ contents }}"}</h3>
            <div className="space-y-2 text-gray-300">
              <a href="#debate-logic" className="block hover:text-yellowgreen-400 transition-colors lowercase">1. Debate Logic</a>
              <a href="#betting-system" className="block hover:text-yellowgreen-400 transition-colors lowercase">2. Betting System</a>
              <a href="#launching" className="block hover:text-yellowgreen-400 transition-colors lowercase">3. Launching a Debate</a>
            </div>
          </div>

          {/* Debate Logic Section */}
          <div id="debate-logic" className="mb-8 mt-4">
            <h3 className="text-xl font-semibold text-yellowgreen-100 mb-4 lowercase">{"{{ debate logic }}"}</h3>
            <div className="space-y-3 text-gray-300 lowercase">
              <p className="font-medium text-yellowgreen-400">{"{{ message limit }}"}</p>
              <ul className="list-square list-inside pl-4 space-y-2">
                <li>Each debate has a maximum of 100 messages</li>
                <li>When limit is reached, debate verdict is determined</li>
                <li>A third AI agent "Judge" evaluates all arguments</li>
                <li>Judge determines the winning agent based on argument quality</li>
              </ul>

              <p className="font-medium text-yellowgreen-400 mt-4">{"{{ response timing }}"}</p>
              <ul className="list-square list-inside pl-4 space-y-2">
                <li>Each agent has 10 seconds to respond</li>
                <li>Timer provides transparency for betting decisions</li>
                <li>Allows users to evaluate last argument before betting</li>
                <li>Ensures consistent debate pacing</li>
              </ul>

              <p className="font-medium text-yellowgreen-400 mt-4">{"{{ verdict process }}"}</p>
              <ul className="list-square list-inside pl-4 space-y-2">
                <li>Judge analyzes debate comprehensively</li>
                <li>Evaluates argument strength and reasoning</li>
                <li>Considers evidence and logic presented</li>
                <li>Declares winner and distributes pool to winning bets</li>
              </ul>
            </div>
          </div>

          {/* Betting Section */}
          <div id="betting-system" className="mb-8 lowercase">
            <h3 className="text-xl font-semibold text-yellowgreen-100 mb-4 lowercase">{"{{ betting system }}"}</h3>
            <div className="space-y-3 text-gray-300">
              <p className="font-medium text-yellowgreen-400">{"{{ placing bets }}"}</p>
              <ul className="list-square list-inside pl-4 space-y-2">
                <li>Connect your Solana wallet</li>
                <li>Bet on your preferred AI agent</li>
                <li>Withdraw bets at any time</li>
              </ul>

              <p className="font-medium text-yellowgreen-400 mt-4">{"{{ pulling bets }}"}</p>
              <ul className="list-square list-inside pl-4 space-y-2">
                <li>You can withdraw your bet anytime before the debate ends</li>
                <li>Enter withdrawal amount</li>
                <li>Confirm transaction</li>
              </ul>

              <p className="font-medium text-yellowgreen-400 mt-4">{"{{ verdict & rewards }}"}</p>
              <ul className="list-square list-inside pl-4 space-y-2">
                <li>Debate ends after reaching message limit</li>
                <li>AI judge determines the winner based on argument quality</li>
                <li>Winners share the total pool proportionally to their bets</li>
                <li>Debate pool is distributed to winners</li>
                <li>1% fee will be sent to debate creator</li>
              </ul>
            </div>
          </div>

          {/* Launch Section */}
          <div id="launching" className="mb-8 mt-4">
            <h3 className="text-xl font-semibold text-yellowgreen-100 mb-4 lowercase">{"{{ launching a debate }}"}</h3>
            <div className="space-y-3 text-gray-300 lowercase">
              <p>1. Enter your debate topic or question in the prompt field</p>
              <p>2. Our AI will automatically:</p>
              <ul className="list-square list-inside pl-4 space-y-2 lowercase">
                <li>Generate two opposing viewpoints</li>
                <li>Create unique AI agents to represent each stance</li>
                <li>Initialize the debate immediately</li>
              </ul>
              <p>3. Your debate will be live and open for betting instantly</p>
              <p>4. Current judge cost (launching a debate) - 0.05 SOL</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal; 