import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Plus,
  RefreshCw,
  Sparkles,
  BookOpen,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
} from 'lucide-react';
import { StudentProgressData, AccentColor, SuperpowerTab } from '../types';
import { ProgressTracker } from '../utils/progressTracker';
import { ACCENT_THEMES } from '../utils/theme';
import { triggerQuizConfetti } from '../utils/confetti';

interface MyProgressProps {
  accentColor?: AccentColor;
  onNavigateTab: (tab: SuperpowerTab) => void;
}

export const MyProgress: React.FC<MyProgressProps> = ({
  accentColor = 'amber',
  onNavigateTab,
}) => {
  const currentTheme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.amber;
  const themeHex = currentTheme.previewHex;

  const [progressData, setProgressData] = useState<StudentProgressData>(() =>
    ProgressTracker.loadProgress()
  );

  const [timeRange, setTimeRange] = useState<'7days' | '14days'>('7days');
  const [activeChartTab, setActiveChartTab] = useState<'quizzes' | 'studyTime' | 'subjects'>(
    'quizzes'
  );

  // Focus Timer state for tracking daily study session
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [sessionMinutesLogged, setSessionMinutesLogged] = useState<number>(0);

  // Reload progress data on mount & periodic sync
  const refreshData = () => {
    const updated = ProgressTracker.loadProgress();
    setProgressData(updated);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const next = prev + 1;
          // Every 60 seconds, auto-credit 1 minute of active study time to today's stats
          if (next % 60 === 0) {
            ProgressTracker.recordStudyMinutes(1);
            setSessionMinutesLogged((m) => m + 1);
            refreshData();
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleToggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setSessionMinutesLogged(0);
  };

  const handleQuickAddStudyMinutes = (mins: number) => {
    ProgressTracker.recordStudyMinutes(mins);
    setSessionMinutesLogged((m) => m + mins);
    refreshData();
  };

  const handleSimulateQuizAttempt = () => {
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Social Studies'];
    const randomSub = subjects[Math.floor(Math.random() * subjects.length)];
    const earned = Math.floor(Math.random() * 5) + 12; // 12-16 marks
    const max = 16;
    const pct = Math.round((earned / max) * 100);

    ProgressTracker.recordQuizCompleted({
      title: `${randomSub} Model Revision Exam`,
      subject: randomSub,
      earnedScore: earned,
      maxScore: max,
      percentage: pct,
      difficulty: 'Medium',
      durationSeconds: 300,
    });
    refreshData();
    triggerQuizConfetti({
      percentage: pct,
      earnedScore: earned,
      maxScore: max,
    });
  };

  // Formatted timer text
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Metrics Data for charts
  const chronologicalMetrics = useMemo(() => {
    return timeRange === '7days'
      ? ProgressTracker.get7DayChronologicalMetrics()
      : ProgressTracker.get14DayChronologicalMetrics();
  }, [progressData, timeRange]);

  const subjectData = useMemo(() => {
    return ProgressTracker.getSubjectBreakdown();
  }, [progressData]);

  // Today's total study minutes
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayRecord = progressData.dailyStudyHistory[todayDateStr] || {
    studyMinutes: 0,
    quizzesTaken: 0,
    averageScorePercent: 0,
  };

  // Total Study Hours & Minutes
  const totalHours = Math.floor(progressData.totalStudyMinutes / 60);
  const remainingMinutes = progressData.totalStudyMinutes % 60;

  // Custom Recharts Tooltip for Daily Quizzes & Scores
  const CustomQuizScoreTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-[#18181B] border border-zinc-700/80 rounded-2xl p-3.5 shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <p className="font-bold text-zinc-100 flex items-center justify-between gap-3 border-b border-zinc-700/50 pb-1">
            <span>{label}</span>
            <span className="text-zinc-400 font-normal">{dataPoint.displayDate}</span>
          </p>
          <div className="flex items-center justify-between gap-4 text-zinc-200">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              Quizzes Taken:
            </span>
            <span className="font-extrabold text-zinc-100">{dataPoint.quizzesTaken}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-200">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Avg Score:
            </span>
            <span className="font-extrabold text-zinc-100">
              {dataPoint.quizzesTaken > 0 ? `${dataPoint.averageScorePercent}%` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400 pt-0.5 text-[11px]">
            <span>Study Time:</span>
            <span>{dataPoint.studyMinutes} mins</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Study Time
  const CustomStudyTimeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-[#18181B] border border-zinc-700/80 rounded-2xl p-3.5 shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <p className="font-bold text-zinc-100 flex items-center justify-between gap-3 border-b border-zinc-700/50 pb-1">
            <span>{label}</span>
            <span className="text-zinc-400 font-normal">{dataPoint.displayDate}</span>
          </p>
          <div className="flex items-center justify-between gap-4 text-zinc-200">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Study Time:
            </span>
            <span className="font-extrabold text-zinc-100">{dataPoint.studyMinutes} mins</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400 text-[11px]">
            <span>Daily Goal (60m):</span>
            <span className={dataPoint.studyMinutes >= 60 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {dataPoint.studyMinutes >= 60 ? 'Goal Achieved ✨' : `${60 - dataPoint.studyMinutes}m remaining`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Subjects
  const CustomSubjectTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-[#18181B] border border-zinc-700/80 rounded-2xl p-3.5 shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <p className="font-bold text-zinc-100 border-b border-zinc-700/50 pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between gap-4 text-zinc-200">
            <span className="text-indigo-300">Quizzes Taken:</span>
            <span className="font-extrabold text-zinc-100">{dataPoint.quizzesCount}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-200">
            <span className="text-amber-400">Avg Accuracy:</span>
            <span className="font-extrabold text-amber-300">{dataPoint.avgScore}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400 text-[11px]">
            <span>Peak Score:</span>
            <span className="text-emerald-400 font-semibold">{dataPoint.highestScore}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-[#121215] rounded-3xl p-6 sm:p-7 border border-zinc-800/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full theme-accent-bg-subtle theme-accent-text border theme-accent-border-subtle text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Smart Study Analytics & Performance Hub 📊</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-heading tracking-tight">
              My Academic Progress <span className="theme-accent-text">& Milestones</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Track your daily study consistency, quizzes solved, accuracy trends, and exam mastery.
            </p>
          </div>

          {/* Live Focus Study Tracker Widget */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-bold text-sm ${
                isTimerRunning
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">Live Study Focus Timer</p>
                <p className="text-lg font-mono font-extrabold text-zinc-100">
                  {formatTimer(timerSeconds)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-toggle-focus-timer"
                onClick={handleToggleTimer}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isTimerRunning
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'theme-accent-bg text-zinc-950 hover:opacity-90 font-extrabold shadow-sm'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Focus</span>
                  </>
                )}
              </button>

              <button
                id="btn-reset-focus-timer"
                onClick={handleResetTimer}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Reset session timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                id="btn-quick-add-15m"
                onClick={() => handleQuickAddStudyMinutes(15)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700/80 transition-colors cursor-pointer"
                title="Quickly log 15 mins of offline revision"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+15m</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Quizzes */}
        <div className="bg-[#121215] rounded-2xl p-5 border border-zinc-800/90 shadow-sm relative group hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Quizzes
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100 font-heading">
              {progressData.totalQuizzesTaken}
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              +{todayRecord.quizzesTaken} today
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            Across MCQs & senior model questions
          </p>
        </div>

        {/* Metric 2: Average Score */}
        <div className="bg-[#121215] rounded-2xl p-5 border border-zinc-800/90 shadow-sm relative group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100 font-heading">
              {progressData.averageQuizScorePercent}%
            </span>
            <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {progressData.averageQuizScorePercent >= 85
                ? 'Distinction 🏆'
                : progressData.averageQuizScorePercent >= 70
                ? 'First Class 🌟'
                : 'Good Effort 📚'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            Exam accuracy across all subjects
          </p>
        </div>

        {/* Metric 3: Daily Study Time Tracked */}
        <div className="bg-[#121215] rounded-2xl p-5 border border-zinc-800/90 shadow-sm relative group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Study Time Tracked
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100 font-heading">
              {totalHours > 0 ? `${totalHours}h ` : ''}{remainingMinutes}m
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {todayRecord.studyMinutes}m today
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            Active reading & practice time
          </p>
        </div>

        {/* Metric 4: Study Streak */}
        <div className="bg-[#121215] rounded-2xl p-5 border border-zinc-800/90 shadow-sm relative group hover:border-orange-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Active Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100 font-heading">
              {progressData.studyStreakDays} <span className="text-lg font-bold text-zinc-400">Days</span>
            </span>
            <span className="text-xs font-semibold text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
              🔥 Consistent
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            Keep practicing daily to stay sharp!
          </p>
        </div>
      </div>

      {/* Main Recharts Analytics Card */}
      <div className="bg-[#121215] rounded-3xl p-6 sm:p-7 border border-zinc-800/90 shadow-sm">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-zinc-100 font-heading">
                Performance Analytics & Trend Graphs
              </h2>
              <p className="text-xs text-zinc-400">
                Visualized with Recharts — interactive bar graphs for quizzes, scores & study minutes
              </p>
            </div>
          </div>

          {/* Toggle Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Sub-Tab Switcher */}
            <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800">
              <button
                id="btn-chart-quizzes"
                onClick={() => setActiveChartTab('quizzes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'quizzes'
                    ? 'theme-accent-bg text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Quizzes & Scores
              </button>
              <button
                id="btn-chart-study-time"
                onClick={() => setActiveChartTab('studyTime')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'studyTime'
                    ? 'theme-accent-bg text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Study Time (Mins)
              </button>
              <button
                id="btn-chart-subjects"
                onClick={() => setActiveChartTab('subjects')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'subjects'
                    ? 'theme-accent-bg text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                By Subject
              </button>
            </div>

            {/* Time range selector (applicable to 7/14 days) */}
            {activeChartTab !== 'subjects' && (
              <select
                id="select-time-range"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
              >
                <option value="7days">Last 7 Days 🗓️</option>
                <option value="14days">Last 14 Days 🗓️</option>
              </select>
            )}
          </div>
        </div>

        {/* Chart Canvas Container */}
        <div className="pt-6">
          {activeChartTab === 'quizzes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
                  <strong className="text-zinc-200">Quizzes Taken</strong> (Left Axis)
                  <span className="mx-2 text-zinc-600">•</span>
                  <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                  <strong className="text-zinc-200">Average Score %</strong> (Right Axis)
                </span>
                <span className="hidden sm:inline text-zinc-500">
                  Hover over bars to inspect daily metrics
                </span>
              </div>

              <div className="h-72 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chronologicalMetrics}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                    <XAxis
                      dataKey="dayLabel"
                      stroke="#71717A"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#3F3F46' }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#818CF8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 'dataMax + 2']}
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#FBBF24"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      unit="%"
                    />
                    <Tooltip content={<CustomQuizScoreTooltip />} cursor={{ fill: '#27272A', opacity: 0.4 }} />
                    <Legend
                      wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
                      formatter={(value) => <span className="text-zinc-300">{value}</span>}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="quizzesTaken"
                      name="Quizzes Taken (count)"
                      fill="#6366F1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="averageScorePercent"
                      name="Average Score (%)"
                      fill={themeHex}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeChartTab === 'studyTime' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <strong className="text-zinc-200">Daily Study Minutes Tracked</strong>
                  <span className="mx-2 text-zinc-600">•</span>
                  <span className="text-zinc-400">Target: 60 mins/day</span>
                </span>
                <span className="hidden sm:inline text-zinc-500">
                  Includes live focus timer, summarizer & quiz sessions
                </span>
              </div>

              <div className="h-72 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chronologicalMetrics}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                    <XAxis
                      dataKey="dayLabel"
                      stroke="#71717A"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#3F3F46' }}
                    />
                    <YAxis
                      stroke="#34D399"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit="m"
                    />
                    <Tooltip content={<CustomStudyTimeTooltip />} cursor={{ fill: '#27272A', opacity: 0.4 }} />
                    <ReferenceLine
                      y={60}
                      stroke="#F59E0B"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Daily Target (60m)',
                        fill: '#FBBF24',
                        fontSize: 11,
                        position: 'insideTopRight',
                      }}
                    />
                    <Bar
                      dataKey="studyMinutes"
                      name="Study Time (Minutes)"
                      fill="#10B981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                    >
                      {chronologicalMetrics.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.studyMinutes >= 60 ? '#10B981' : themeHex}
                          opacity={entry.studyMinutes > 0 ? 0.9 : 0.25}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeChartTab === 'subjects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
                  <strong className="text-zinc-200">Subject Accuracy & Volume</strong>
                </span>
                <span className="hidden sm:inline text-zinc-500">
                  Performance across Indian curriculum topics
                </span>
              </div>

              <div className="h-72 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 35, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      stroke="#71717A"
                      fontSize={11}
                      unit="%"
                      axisLine={{ stroke: '#3F3F46' }}
                    />
                    <YAxis
                      dataKey="subject"
                      type="category"
                      stroke="#D4D4D8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip content={<CustomSubjectTooltip />} cursor={{ fill: '#27272A', opacity: 0.4 }} />
                    <Bar
                      dataKey="avgScore"
                      name="Average Score (%)"
                      fill={themeHex}
                      radius={[0, 6, 6, 0]}
                      maxBarSize={24}
                    >
                      {subjectData.map((_, index) => (
                        <Cell
                          key={`subject-cell-${index}`}
                          fill={['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'][index % 5]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Recent Quiz History & Study Habits Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Quiz Ledger */}
        <div className="lg:col-span-2 bg-[#121215] rounded-3xl p-6 border border-zinc-800/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 theme-accent-text" />
              <h3 className="text-base font-extrabold text-zinc-100 font-heading">
                Recent Quiz Attempts Ledger 📝
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-simulate-quiz-record"
                onClick={handleSimulateQuizAttempt}
                className="text-xs font-bold theme-accent-text hover:underline cursor-pointer flex items-center gap-1"
                title="Log a sample quiz score to test dynamic graphs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Practice Quiz</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {progressData.quizAttempts.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                No quiz attempts logged yet. Take a quiz to see your scores here!
              </div>
            ) : (
              progressData.quizAttempts.slice(0, 8).map((attempt) => (
                <div
                  key={attempt.id}
                  className="bg-zinc-900/80 hover:bg-zinc-850 p-3.5 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {attempt.subject}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-200 truncate">
                        {attempt.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Attempted on {attempt.dateStr} • {Math.round((attempt.durationSeconds || 300) / 60)} mins
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-300">
                        {attempt.earnedScore} / {attempt.maxScore}
                      </span>
                      <p className={`text-[11px] font-extrabold ${
                        attempt.percentage >= 85
                          ? 'text-emerald-400'
                          : attempt.percentage >= 70
                          ? 'text-amber-400'
                          : 'text-indigo-400'
                      }`}>
                        {attempt.percentage}%
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigateTab('quiz')}
                      className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
                      title="Practice more quizzes"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Senior Study Tips & Quick Actions */}
        <div className="bg-[#121215] rounded-3xl p-6 border border-zinc-800/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-extrabold text-zinc-100 font-heading">
                AI Senior's Study Insights 💡
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-300 space-y-2">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <span>🎯 Consistency Advice</span>
              </p>
              <p className="leading-relaxed">
                "Super proud of your {progressData.studyStreakDays}-day streak! 
                Students who review notes right after taking a quiz score 25% higher on board exams."
              </p>
            </div>

            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Notes Summarized
                </span>
                <span className="font-bold text-zinc-200">{progressData.totalNotesSummarized}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  Assignments Evaluated
                </span>
                <span className="font-bold text-zinc-200">{progressData.totalAssignmentsEvaluated}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 space-y-2">
            <button
              onClick={() => onNavigateTab('quiz')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold theme-accent-bg text-zinc-950 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Launch Next Practice Quiz</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Reset all study progress history back to default?')) {
                  ProgressTracker.resetAllProgress();
                  refreshData();
                }
              }}
              className="w-full text-center text-[11px] text-zinc-500 hover:text-zinc-400 py-1 transition-colors cursor-pointer"
            >
              Reset / Re-seed Progress Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
