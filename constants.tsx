import React from 'react';
import { TimerPreset } from './types';
import { Coffee, Zap, Bed, Egg, Dumbbell, Code } from 'lucide-react';

export const DEFAULT_PRESETS: TimerPreset[] = [
  { id: '1', name: 'Focus', durationSeconds: 25 * 60, icon: 'Zap', color: 'text-orange-500' },
  { id: '2', name: 'Short Break', durationSeconds: 5 * 60, icon: 'Coffee', color: 'text-blue-400' },
  { id: '3', name: 'Nap', durationSeconds: 20 * 60, icon: 'Bed', color: 'text-purple-400' },
  { id: '4', name: 'Soft Boiled', durationSeconds: 6 * 60, icon: 'Egg', color: 'text-yellow-400' },
  { id: '5', name: 'Workout', durationSeconds: 45 * 60, icon: 'Dumbbell', color: 'text-red-500' },
  { id: '6', name: 'Sprint', durationSeconds: 15 * 60, icon: 'Code', color: 'text-green-400' },
];

export const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Coffee,
  Bed,
  Egg,
  Dumbbell,
  Code
};