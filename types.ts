export enum TimerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

export interface TimerPreset {
  id: string;
  name: string;
  durationSeconds: number;
  icon: string; // Lucide icon name
  color: string;
}

export interface MotivationResponse {
  message: string;
  funFact?: string;
}
