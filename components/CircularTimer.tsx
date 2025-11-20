import React from 'react';

interface CircularTimerProps {
  progress: number; // 0 to 1
  timeLeftFormatted: string;
  totalDuration: number;
  taskName: string;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ progress, timeLeftFormatted, totalDuration, taskName }) => {
  const radius = 120;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* SVG Ring */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="rotate-[-90deg] transition-all duration-500"
        >
          <circle
            stroke="#334155"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="currentColor"
            className="text-primary transition-all duration-1000 ease-linear"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-5xl font-mono font-bold text-white tracking-wider">
            {timeLeftFormatted}
          </div>
          <div className="mt-2 text-slate-400 font-medium uppercase text-sm tracking-widest">
            {taskName}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircularTimer;