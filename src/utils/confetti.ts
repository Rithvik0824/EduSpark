import confetti from 'canvas-confetti';
import { loadStoredUserSettings } from './theme';

export interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  ticks?: number;
  gravity?: number;
  scalar?: number;
  shapes?: ('circle' | 'square' | 'star')[];
}

/**
 * Check if animations and confetti are allowed according to user preferences and system settings
 */
export const isConfettiEnabled = (): boolean => {
  try {
    const settings = loadStoredUserSettings();
    if (settings && settings.showCelebrationConfetti === false) {
      return false;
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return false;
    }
  } catch (e) {
    // Fallback if settings parsing fails
  }
  return true;
};

/**
 * Standard single burst confetti
 */
export const fireBasicConfetti = (options: ConfettiOptions = {}) => {
  if (!isConfettiEnabled()) return;

  confetti({
    particleCount: options.particleCount ?? 80,
    spread: options.spread ?? 70,
    origin: options.origin ?? { y: 0.6, x: 0.5 },
    colors: options.colors ?? ['#F59E0B', '#6366F1', '#10B981', '#EC4899', '#3B82F6', '#FCD34D'],
    ticks: options.ticks ?? 250,
    gravity: options.gravity ?? 1,
    scalar: options.scalar ?? 1.1,
  });
};

/**
 * Dual side cannons shooting celebratory confetti from left and right corners
 */
export const fireDualCannons = (durationMs = 2500) => {
  if (!isConfettiEnabled()) return;

  const end = Date.now() + durationMs;
  const colors = ['#F59E0B', '#6366F1', '#10B981', '#3B82F6', '#EC4899', '#FBBF24', '#A855F7'];

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
      ticks: 200,
      gravity: 0.9,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
      ticks: 200,
      gravity: 0.9,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
};

/**
 * Realistic fireworks shower burst
 */
export const fireFireworks = (count = 3) => {
  if (!isConfettiEnabled()) return;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const x = 0.2 + Math.random() * 0.6;
      const y = 0.2 + Math.random() * 0.4;
      confetti({
        particleCount: 60,
        startVelocity: 30,
        spread: 360,
        ticks: 200,
        origin: { x, y },
        colors: ['#F59E0B', '#6366F1', '#10B981', '#F43F5E', '#8B5CF6', '#FBBF24', '#38BDF8'],
      });
    }, i * 400);
  }
};

/**
 * Academic distinction celebration: Stars, gold dust, and cascading ribbons
 */
export const fireDistinctionCelebration = () => {
  if (!isConfettiEnabled()) return;

  // 1. Initial golden burst
  confetti({
    particleCount: 100,
    spread: 90,
    origin: { y: 0.6, x: 0.5 },
    colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7', '#6366F1'],
    ticks: 300,
    scalar: 1.2,
  });

  // 2. Follow-up dual side cannons
  setTimeout(() => {
    fireDualCannons(2000);
  }, 250);
};

/**
 * Trigger celebration tailored specifically to Quiz performance
 */
export const triggerQuizConfetti = (params: {
  percentage: number;
  earnedScore?: number;
  maxScore?: number;
}) => {
  if (!isConfettiEnabled()) return;

  const { percentage } = params;

  if (percentage >= 90) {
    // 90%+ : Distinction / Top Tier - Fireworks & Dual Cannons!
    fireDistinctionCelebration();
  } else if (percentage >= 70) {
    // 70%-89% : First Class - Vibrant multi-burst
    fireBasicConfetti({
      particleCount: 110,
      spread: 80,
      colors: ['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'],
    });
    setTimeout(() => {
      fireFireworks(2);
    }, 350);
  } else {
    // General Completion encouragement
    fireBasicConfetti({
      particleCount: 75,
      spread: 60,
      colors: ['#6366F1', '#3B82F6', '#10B981', '#F59E0B'],
    });
  }
};

/**
 * Trigger celebration tailored specifically to Assignment Evaluation completion
 */
export const triggerAssignmentConfetti = (params: {
  grade?: string;
  totalMarksAwarded?: number;
  totalMaxMarks?: number;
}) => {
  if (!isConfettiEnabled()) return;

  const { grade = 'A', totalMarksAwarded = 10, totalMaxMarks = 10 } = params;
  const percentage = Math.round((totalMarksAwarded / (totalMaxMarks || 1)) * 100);

  const isTopGrade =
    grade.includes('A+') ||
    grade.includes('O') ||
    grade === 'A' ||
    grade.toLowerCase().includes('distinction') ||
    percentage >= 85;

  if (isTopGrade) {
    // Top Grade / Outstanding Assignment: Full celebratory cascade
    fireDistinctionCelebration();
  } else if (percentage >= 65 || grade.includes('B')) {
    // Good performance
    fireBasicConfetti({
      particleCount: 100,
      spread: 75,
      colors: ['#10B981', '#6366F1', '#F59E0B', '#3B82F6'],
    });
    setTimeout(() => {
      fireFireworks(2);
    }, 300);
  } else {
    // Completion reward
    fireBasicConfetti({
      particleCount: 70,
      spread: 60,
      colors: ['#10B981', '#38BDF8', '#818CF8', '#FBBF24'],
    });
  }
};
