import { StudentProgressData, QuizAttemptRecord, DailyStudyMetrics } from '../types';

const PROGRESS_STORAGE_KEY = 'eduspark_student_progress_v1';

export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return d.toISOString().split('T')[0];
}

export function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getFormattedDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function generateInitialSeedProgress(): StudentProgressData {
  const today = getTodayDateString(0);
  const d1 = getTodayDateString(-1);
  const d2 = getTodayDateString(-2);
  const d3 = getTodayDateString(-3);
  const d4 = getTodayDateString(-4);
  const d5 = getTodayDateString(-5);
  const d6 = getTodayDateString(-6);

  const initialAttempts: QuizAttemptRecord[] = [
    {
      id: 'quiz_seed_1',
      timestamp: Date.now() - 86400000 * 5,
      dateStr: d5,
      title: 'Electromagnetic Induction & Faraday Laws',
      subject: 'Physics',
      earnedScore: 14,
      maxScore: 16,
      percentage: 88,
      difficulty: 'Medium',
      durationSeconds: 420,
    },
    {
      id: 'quiz_seed_2',
      timestamp: Date.now() - 86400000 * 4,
      dateStr: d4,
      title: 'Chemical Kinetics & Rate of Reactions',
      subject: 'Chemistry',
      earnedScore: 12,
      maxScore: 16,
      percentage: 75,
      difficulty: 'Hard',
      durationSeconds: 510,
    },
    {
      id: 'quiz_seed_3',
      timestamp: Date.now() - 86400000 * 3,
      dateStr: d3,
      title: 'Integration by Parts & Definite Integrals',
      subject: 'Mathematics',
      earnedScore: 15,
      maxScore: 16,
      percentage: 94,
      difficulty: 'Hard',
      durationSeconds: 600,
    },
    {
      id: 'quiz_seed_4',
      timestamp: Date.now() - 86400000 * 2,
      dateStr: d2,
      title: 'Genetics & Mendel Laws of Inheritance',
      subject: 'Biology',
      earnedScore: 13,
      maxScore: 16,
      percentage: 81,
      difficulty: 'Medium',
      durationSeconds: 380,
    },
    {
      id: 'quiz_seed_5',
      timestamp: Date.now() - 86400000 * 1,
      dateStr: d1,
      title: 'Indian Freedom Movement & Non-Cooperation',
      subject: 'Social Studies',
      earnedScore: 16,
      maxScore: 16,
      percentage: 100,
      difficulty: 'Easy',
      durationSeconds: 320,
    },
    {
      id: 'quiz_seed_6',
      timestamp: Date.now() - 3600000 * 3,
      dateStr: today,
      title: 'Thermodynamics & Heat Capacities',
      subject: 'Physics',
      earnedScore: 13,
      maxScore: 16,
      percentage: 81,
      difficulty: 'Medium',
      durationSeconds: 450,
    },
  ];

  const dailyHistory: Record<string, DailyStudyMetrics> = {
    [d6]: {
      date: d6,
      dayLabel: getDayLabel(d6),
      studyMinutes: 35,
      quizzesTaken: 0,
      averageScorePercent: 0,
      notesSummarized: 2,
      assignmentsEvaluated: 1,
    },
    [d5]: {
      date: d5,
      dayLabel: getDayLabel(d5),
      studyMinutes: 55,
      quizzesTaken: 1,
      averageScorePercent: 88,
      notesSummarized: 1,
      assignmentsEvaluated: 0,
    },
    [d4]: {
      date: d4,
      dayLabel: getDayLabel(d4),
      studyMinutes: 45,
      quizzesTaken: 1,
      averageScorePercent: 75,
      notesSummarized: 2,
      assignmentsEvaluated: 1,
    },
    [d3]: {
      date: d3,
      dayLabel: getDayLabel(d3),
      studyMinutes: 70,
      quizzesTaken: 1,
      averageScorePercent: 94,
      notesSummarized: 3,
      assignmentsEvaluated: 0,
    },
    [d2]: {
      date: d2,
      dayLabel: getDayLabel(d2),
      studyMinutes: 50,
      quizzesTaken: 1,
      averageScorePercent: 81,
      notesSummarized: 1,
      assignmentsEvaluated: 2,
    },
    [d1]: {
      date: d1,
      dayLabel: getDayLabel(d1),
      studyMinutes: 65,
      quizzesTaken: 1,
      averageScorePercent: 100,
      notesSummarized: 2,
      assignmentsEvaluated: 1,
    },
    [today]: {
      date: today,
      dayLabel: getDayLabel(today),
      studyMinutes: 40,
      quizzesTaken: 1,
      averageScorePercent: 81,
      notesSummarized: 1,
      assignmentsEvaluated: 1,
    },
  };

  const totalStudyMinutes = Object.values(dailyHistory).reduce((acc, d) => acc + d.studyMinutes, 0);
  const totalQuizzes = initialAttempts.length;
  const avgScore = Math.round(
    initialAttempts.reduce((acc, q) => acc + q.percentage, 0) / (totalQuizzes || 1)
  );

  return {
    totalStudyMinutes,
    totalQuizzesTaken: totalQuizzes,
    averageQuizScorePercent: avgScore,
    totalNotesSummarized: 12,
    totalAssignmentsEvaluated: 6,
    studyStreakDays: 6,
    lastActiveDate: today,
    quizAttempts: initialAttempts,
    dailyStudyHistory: dailyHistory,
  };
}

export const ProgressTracker = {
  loadProgress(): StudentProgressData {
    try {
      const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (stored) {
        const parsed: StudentProgressData = JSON.parse(stored);
        const today = getTodayDateString(0);
        // Ensure today's entry exists
        if (!parsed.dailyStudyHistory[today]) {
          parsed.dailyStudyHistory[today] = {
            date: today,
            dayLabel: getDayLabel(today),
            studyMinutes: 0,
            quizzesTaken: 0,
            averageScorePercent: 0,
            notesSummarized: 0,
            assignmentsEvaluated: 0,
          };
        }
    // Check and update daily streak upon app load
    if (parsed.lastActiveDate !== today) {
      const yesterday = getTodayDateString(-1);
      if (parsed.lastActiveDate === yesterday) {
        parsed.studyStreakDays = (parsed.studyStreakDays || 0) + 1;
      } else {
        parsed.studyStreakDays = 1;
      }
      parsed.lastActiveDate = today;
      try {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(parsed));
      } catch (e) {
        console.warn('Failed to save streak update:', e);
      }
    }
    return parsed;
  }
} catch (e) {
  console.warn('Failed to load progress from localStorage', e);
}
const fresh = generateInitialSeedProgress();
this.saveProgress(fresh);
return fresh;
},

getStreakDays(): number {
  try {
    const data = this.loadProgress();
    return Math.max(1, data.studyStreakDays || 1);
  } catch {
    return 1;
  }
},

  saveProgress(data: StudentProgressData): void {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save progress to localStorage', e);
    }
  },

  recordQuizCompleted(
    params: Omit<QuizAttemptRecord, 'id' | 'timestamp' | 'dateStr'>
  ): QuizAttemptRecord {
    const data = this.loadProgress();
    const today = getTodayDateString(0);

    const newAttempt: QuizAttemptRecord = {
      id: 'quiz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
      dateStr: today,
      ...params,
    };

    data.quizAttempts.unshift(newAttempt);
    data.totalQuizzesTaken = data.quizAttempts.length;

    // Recalculate average percentage
    const totalPct = data.quizAttempts.reduce((acc, q) => acc + q.percentage, 0);
    data.averageQuizScorePercent = Math.round(totalPct / (data.quizAttempts.length || 1));

    // Update today's record
    if (!data.dailyStudyHistory[today]) {
      data.dailyStudyHistory[today] = {
        date: today,
        dayLabel: getDayLabel(today),
        studyMinutes: 0,
        quizzesTaken: 0,
        averageScorePercent: 0,
        notesSummarized: 0,
        assignmentsEvaluated: 0,
      };
    }

    const todayRec = data.dailyStudyHistory[today];
    const todayAttempts = data.quizAttempts.filter((q) => q.dateStr === today);
    todayRec.quizzesTaken = todayAttempts.length;
    todayRec.averageScorePercent = Math.round(
      todayAttempts.reduce((acc, q) => acc + q.percentage, 0) / (todayAttempts.length || 1)
    );

    // Approximate 5 minutes of study per quiz attempt
    todayRec.studyMinutes += Math.round((params.durationSeconds || 300) / 60);
    data.totalStudyMinutes += Math.round((params.durationSeconds || 300) / 60);

    // Streak handling
    if (data.lastActiveDate !== today) {
      const yesterday = getTodayDateString(-1);
      if (data.lastActiveDate === yesterday) {
        data.studyStreakDays += 1;
      } else {
        data.studyStreakDays = 1;
      }
      data.lastActiveDate = today;
    }

    this.saveProgress(data);
    return newAttempt;
  },

  recordStudyMinutes(minutes: number): void {
    if (minutes <= 0) return;
    const data = this.loadProgress();
    const today = getTodayDateString(0);

    if (!data.dailyStudyHistory[today]) {
      data.dailyStudyHistory[today] = {
        date: today,
        dayLabel: getDayLabel(today),
        studyMinutes: 0,
        quizzesTaken: 0,
        averageScorePercent: 0,
        notesSummarized: 0,
        assignmentsEvaluated: 0,
      };
    }

    data.dailyStudyHistory[today].studyMinutes += minutes;
    data.totalStudyMinutes += minutes;
    data.lastActiveDate = today;
    this.saveProgress(data);
  },

  recordNoteSummary(): void {
    const data = this.loadProgress();
    const today = getTodayDateString(0);

    if (!data.dailyStudyHistory[today]) {
      data.dailyStudyHistory[today] = {
        date: today,
        dayLabel: getDayLabel(today),
        studyMinutes: 0,
        quizzesTaken: 0,
        averageScorePercent: 0,
        notesSummarized: 0,
        assignmentsEvaluated: 0,
      };
    }

    data.dailyStudyHistory[today].notesSummarized += 1;
    data.dailyStudyHistory[today].studyMinutes += 3; // +3 mins study time per summary
    data.totalNotesSummarized += 1;
    data.totalStudyMinutes += 3;
    data.lastActiveDate = today;
    this.saveProgress(data);
  },

  recordAssignmentEvaluated(): void {
    const data = this.loadProgress();
    const today = getTodayDateString(0);

    if (!data.dailyStudyHistory[today]) {
      data.dailyStudyHistory[today] = {
        date: today,
        dayLabel: getDayLabel(today),
        studyMinutes: 0,
        quizzesTaken: 0,
        averageScorePercent: 0,
        notesSummarized: 0,
        assignmentsEvaluated: 0,
      };
    }

    data.dailyStudyHistory[today].assignmentsEvaluated += 1;
    data.dailyStudyHistory[today].studyMinutes += 5; // +5 mins study time
    data.totalAssignmentsEvaluated += 1;
    data.totalStudyMinutes += 5;
    data.lastActiveDate = today;
    this.saveProgress(data);
  },

  get7DayChronologicalMetrics(): (DailyStudyMetrics & { displayDate: string })[] {
    const data = this.loadProgress();
    const days: (DailyStudyMetrics & { displayDate: string })[] = [];

    for (let i = 6; i >= 0; i--) {
      const dStr = getTodayDateString(-i);
      const rec = data.dailyStudyHistory[dStr] || {
        date: dStr,
        dayLabel: getDayLabel(dStr),
        studyMinutes: 0,
        quizzesTaken: 0,
        averageScorePercent: 0,
        notesSummarized: 0,
        assignmentsEvaluated: 0,
      };

      days.push({
        ...rec,
        dayLabel: i === 0 ? 'Today' : rec.dayLabel,
        displayDate: getFormattedDate(dStr),
      });
    }

    return days;
  },

  get14DayChronologicalMetrics(): (DailyStudyMetrics & { displayDate: string })[] {
    const data = this.loadProgress();
    const days: (DailyStudyMetrics & { displayDate: string })[] = [];

    for (let i = 13; i >= 0; i--) {
      const dStr = getTodayDateString(-i);
      const rec = data.dailyStudyHistory[dStr] || {
        date: dStr,
        dayLabel: getDayLabel(dStr),
        studyMinutes: 0,
        quizzesTaken: 0,
        averageScorePercent: 0,
        notesSummarized: 0,
        assignmentsEvaluated: 0,
      };

      days.push({
        ...rec,
        dayLabel: i === 0 ? 'Today' : getDayLabel(dStr),
        displayDate: getFormattedDate(dStr),
      });
    }

    return days;
  },

  getSubjectBreakdown(): {
    subject: string;
    quizzesCount: number;
    avgScore: number;
    highestScore: number;
  }[] {
    const data = this.loadProgress();
    const subjectMap: Record<
      string,
      { count: number; totalPct: number; maxScore: number }
    > = {};

    data.quizAttempts.forEach((attempt) => {
      const sub = attempt.subject?.trim() || 'General Science';
      if (!subjectMap[sub]) {
        subjectMap[sub] = { count: 0, totalPct: 0, maxScore: 0 };
      }
      subjectMap[sub].count += 1;
      subjectMap[sub].totalPct += attempt.percentage;
      if (attempt.percentage > subjectMap[sub].maxScore) {
        subjectMap[sub].maxScore = attempt.percentage;
      }
    });

    return Object.entries(subjectMap).map(([subject, stats]) => ({
      subject,
      quizzesCount: stats.count,
      avgScore: Math.round(stats.totalPct / (stats.count || 1)),
      highestScore: stats.maxScore,
    }));
  },

  resetAllProgress(): StudentProgressData {
    const fresh = generateInitialSeedProgress();
    this.saveProgress(fresh);
    return fresh;
  },
};
