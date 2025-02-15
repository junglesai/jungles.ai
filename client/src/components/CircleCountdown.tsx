import React, { useEffect, useState } from 'react';

interface Props {
  duration: number;  // in milliseconds
  isFirstAgent: boolean;
  onComplete?: () => void;
}

const CircleCountdown: React.FC<Props> = ({ duration, isFirstAgent, onComplete }) => {
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      const timeRemaining = Math.max(0, duration - elapsed);
      
      setProgress(remaining);
      setTimeLeft(timeRemaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onComplete?.();  // Call onComplete when timer ends
      }
    }, 16); // Increased update frequency for smoother milliseconds

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  // Calculate color based on progress
  const getColor = () => {
    if (progress > 66) return 'rgb(169, 255, 0)';  // yellowgreen-400
    if (progress > 33) return 'rgb(234, 179, 8)';  // yellow-500
    return 'rgb(239, 68, 68)';  // red-400
  };

  const radius = 24;  // Increased from 20
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Format time as ss:ms
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10); // Get only 2 digits
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="inline-flex items-center justify-center relative">
      <svg className="transform -rotate-90 w-20 h-20"> 
        <circle
          cx="40" 
          cy="40"
          r={radius}
          stroke="currentColor"
          strokeWidth="2.5"
          fill="transparent"
          className="text-gray-700"
        />
        <circle
          cx="40"  
          cy="40"
          r={radius}
          stroke={getColor()}
          strokeWidth="2.5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-50"
        />
      </svg>
      <span 
        className="absolute text-[10px] font-medium px-1.5 rounded" 
        style={{ color: getColor() }}
      >
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default CircleCountdown; 