import React, { useState } from 'react';
import judge from '../assets/images/judgeRight.png';

interface DebateVerdictProps {
  verdict: {
    winner: string;
    explanation: string;
    timestamp: Date;
  } | null | undefined;
}

const DebateVerdict: React.FC<DebateVerdictProps> = ({ verdict }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-4 p-4 bg-gray-700 rounded-lg">
      <img src={judge} alt="Judge" className="w-20 mb-2" />
      <h3 className="text-gray-400 text-sm mb-2">{"{"} Debate Verdict {"}"}</h3>
      {verdict ? (
        <div>
          <p className="text-white font-medium mb-2 flex items-center gap-2"><span>👑</span> <span className="text-yellowgreen-400 mt-1">Winner: {verdict.winner}</span></p>
          <div className={`relative ${!isExpanded && 'max-h-10 overflow-hidden'}`}>
            <p className="text-gray-300">{verdict.explanation}</p>
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-700" />
            )}
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-400 hover:text-gray-200 mt-2"
          >
            {isExpanded ? 'Show Less' : 'Read More'}
          </button>
        </div>
      ) : (
        <p className="text-gray-500 italic">The verdict will be displayed here once the debate is completed.</p>
      )}
    </div>
  );
};

export default DebateVerdict; 