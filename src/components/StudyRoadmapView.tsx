import React, { useState, useEffect } from 'react';
import { StudyRoadmap, StudyRoadmapStep, RoadmapDifficulty } from '../types';
import { generateStudyRoadmap } from '../services/api';
import { fireBasicConfetti, fireDistinctionCelebration } from '../utils/confetti';
import {
  Milestone,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Target,
  Award,
  BookOpen,
  ArrowRight,
  Flame,
  Lightbulb,
  CheckSquare,
  Square,
  Compass,
  Zap,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Copy,
  Check,
  ListOrdered,
  AlertCircle,
  Brain,
  Share2,
} from 'lucide-react';

interface StudyRoadmapViewProps {
  subject: string;
  topic: string;
  classLevel?: string;
  notesContext?: string;
  onGoToQuiz?: (topicOrNotes: string, subject?: string) => void;
  accentColor?: string;
}

export const StudyRoadmapView: React.FC<StudyRoadmapViewProps> = ({
  subject,
  topic,
  classLevel = 'Class 10 (CBSE / State)',
  notesContext,
  onGoToQuiz,
}) => {
  const [roadmap, setRoadmap] = useState<StudyRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Target Focus mode
  const [targetFocus, setTargetFocus] = useState<'comprehensive' | 'exam_cram' | 'conceptual_deep_dive'>('comprehensive');

  // Completed step IDs (stored per subject + topic in localStorage)
  const storageKey = `eduspark_roadmap_${encodeURIComponent(subject)}_${encodeURIComponent(topic)}`;
  const [completedStepIds, setCompletedStepIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Completed checklist items
  const checklistStorageKey = `eduspark_checklist_${encodeURIComponent(subject)}_${encodeURIComponent(topic)}`;
  const [completedChecklist, setCompletedChecklist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(checklistStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Expanded step for deep details (defaults to first incomplete step)
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const loadRoadmap = async (focusOverride?: typeof targetFocus) => {
    if (!subject && !topic) return;

    setIsLoading(true);
    setError(null);

    const activeFocus = focusOverride || targetFocus;

    try {
      const data = await generateStudyRoadmap({
        subject: subject || 'Science',
        topic: topic || subject || 'Core Principles',
        classLevel,
        notesContext,
        targetFocus: activeFocus,
      });

      setRoadmap(data);
      // Expand the first step by default
      if (data.milestones && data.milestones.length > 0) {
        const firstIncomplete = data.milestones.find((m) => !completedStepIds.includes(m.id)) || data.milestones[0];
        setExpandedStepId(firstIncomplete.id);
      }
    } catch (err: any) {
      console.error('Roadmap generation failed:', err);
      setError(err.message || 'Failed to generate study roadmap. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, [subject, topic]);

  // Toggle milestone completion
  const handleToggleStep = (stepId: string) => {
    setCompletedStepIds((prev) => {
      const isAlreadyDone = prev.includes(stepId);
      const updated = isAlreadyDone ? prev.filter((id) => id !== stepId) : [...prev, stepId];

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save roadmap state:', e);
      }

      // Celebrate when completing a step
      if (!isAlreadyDone) {
        if (roadmap && updated.length === roadmap.milestones.length) {
          // All steps completed! Grand celebration
          fireDistinctionCelebration();
        } else {
          fireBasicConfetti({
            particleCount: 60,
            spread: 55,
            colors: ['#F59E0B', '#10B981', '#6366F1', '#3B82F6'],
          });
        }
      }

      return updated;
    });
  };

  // Toggle exam checklist item
  const handleToggleChecklist = (index: number) => {
    setCompletedChecklist((prev) => {
      const updated = prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index];
      try {
        localStorage.setItem(checklistStorageKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Checklist save failed:', e);
      }
      return updated;
    });
  };

  const handleCopyRoadmap = () => {
    if (!roadmap) return;
    const text = `🗺️ Study Roadmap for ${roadmap.topic} (${roadmap.subject})\n\nEstimated Time: ${roadmap.totalEstimatedHours}\n\n${roadmap.milestones
      .map(
        (m, i) =>
          `Step ${i + 1}: ${m.title} (${m.estimatedMinutes}m - ${m.difficulty})\n• Key Concepts: ${m.keyConcepts.join(
            ', '
          )}\n• Task: ${m.practicalTask}\n• Senior Tip: ${m.seniorTip}\n`
      )
      .join('\n')}\nExam Checklist:\n${roadmap.boardExamChecklist.map((c) => `[ ] ${c}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Calculation of progress
  const totalMilestones = roadmap?.milestones?.length || 0;
  const completedCount = roadmap?.milestones?.filter((m) => completedStepIds.includes(m.id)).length || 0;
  const progressPercent = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

  // Remaining estimated minutes
  const remainingMinutes =
    roadmap?.milestones
      ?.filter((m) => !completedStepIds.includes(m.id))
      .reduce((acc, m) => acc + (m.estimatedMinutes || 30), 0) || 0;

  const getDifficultyBadge = (difficulty: RoadmapDifficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Intermediate':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'Advanced':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Exam Mastery':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div
      id="section-study-roadmap"
      className="bg-[#121215] rounded-3xl p-5 sm:p-7 border border-zinc-800/90 shadow-sm space-y-6"
    >
      {/* Header & Goal Tracker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Compass className="w-3.5 h-3.5" />
              <span>Step-by-Step Learning Path</span>
            </span>
            <span className="text-xs text-zinc-400">
              Topic: <strong className="text-zinc-200">{topic || subject}</strong>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading tracking-tight flex items-center gap-2">
            <span>Interactive Study Roadmap</span>
            <Milestone className="w-5 h-5 text-amber-400" />
          </h3>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            A pedagogical step-by-step master plan structured from foundational intuition to high-scoring board exam numericals and diagrams.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            id="btn-copy-roadmap"
            onClick={handleCopyRoadmap}
            disabled={!roadmap || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 transition-all cursor-pointer disabled:opacity-50"
            title="Copy Roadmap text"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied!' : 'Copy Plan'}</span>
          </button>

          <button
            id="btn-regenerate-roadmap"
            onClick={() => loadRoadmap()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isLoading ? 'Planning...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Target Focus Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-zinc-300">Study Strategy Focus:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => {
              setTargetFocus('comprehensive');
              loadRoadmap('comprehensive');
            }}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              targetFocus === 'comprehensive'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🌟 Full Master Plan (0 to 100%)
          </button>

          <button
            onClick={() => {
              setTargetFocus('exam_cram');
              loadRoadmap('exam_cram');
            }}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              targetFocus === 'exam_cram'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ⚡ Exam Cram & High-Yield PYQs
          </button>

          <button
            onClick={() => {
              setTargetFocus('conceptual_deep_dive');
              loadRoadmap('conceptual_deep_dive');
            }}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              targetFocus === 'conceptual_deep_dive'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🔬 Conceptual Intuition & Visuals
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Compass className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-zinc-200 font-heading">
              Designing Your Personalized {subject} Study Roadmap...
            </p>
            <p className="text-xs text-zinc-500">
              Structuring 5 progressive milestones with concept checkpoints and board exam shortcuts for {topic}...
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 text-center space-y-3">
          <p className="text-xs sm:text-sm text-red-300 font-medium">{error}</p>
          <button
            onClick={() => loadRoadmap()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Roadmap Content */}
      {!isLoading && !error && roadmap && (
        <div className="space-y-6">
          {/* Progress Header Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    Roadmap Progress: {completedCount} of {totalMilestones} Steps Done ({progressPercent}%)
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Total Journey: <strong className="text-zinc-200">{roadmap.totalEstimatedHours}</strong>
                  {remainingMinutes > 0 && (
                    <span className="ml-2 text-amber-400 font-semibold">• ~{remainingMinutes} mins remaining</span>
                  )}
                </p>
              </div>

              {progressPercent === 100 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-500 text-zinc-950 shadow-md animate-bounce">
                  <Award className="w-4 h-4" />
                  <span>Roadmap Mastered! 🎉</span>
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Senior Buddy Overview & Quote */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p className="text-zinc-300 leading-relaxed max-w-2xl">{roadmap.overview}</p>
              {roadmap.inspirationalQuote && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium italic text-[11px] flex-shrink-0">
                  💬 "{roadmap.inspirationalQuote}"
                </div>
              )}
            </div>

            {/* Prerequisites */}
            {roadmap.prerequisites && roadmap.prerequisites.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400 pt-1">
                <span className="font-bold text-zinc-500 text-[11px] uppercase">Prerequisites:</span>
                {roadmap.prerequisites.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 text-[11px]"
                  >
                    ✓ {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Stepper Tree / Milestones */}
          <div className="space-y-4 relative">
            {roadmap.milestones.map((step, index) => {
              const isCompleted = completedStepIds.includes(step.id);
              const isExpanded = expandedStepId === step.id;
              const isLast = index === roadmap.milestones.length - 1;

              return (
                <div key={step.id} className="relative flex gap-3 sm:gap-4 items-start group">
                  {/* Vertical connecting line */}
                  {!isLast && (
                    <div
                      className={`absolute left-[19px] sm:left-[23px] top-10 bottom-[-16px] w-0.5 transition-colors ${
                        isCompleted ? 'bg-emerald-500/50' : 'bg-zinc-800'
                      }`}
                    />
                  )}

                  {/* Step Number Circle / Toggle Button */}
                  <button
                    onClick={() => handleToggleStep(step.id)}
                    className={`relative z-10 w-10 sm:w-12 h-10 sm:h-12 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm transition-all cursor-pointer flex-shrink-0 shadow-sm ${
                      isCompleted
                        ? 'bg-emerald-500 text-zinc-950 ring-4 ring-emerald-500/20'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-amber-500 hover:text-amber-400'
                    }`}
                    title={isCompleted ? 'Mark as incomplete' : 'Mark step as complete'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <span>{step.stepNumber}</span>
                    )}
                  </button>

                  {/* Step Card Container */}
                  <div
                    className={`flex-1 rounded-2xl border transition-all overflow-hidden ${
                      isCompleted
                        ? 'bg-zinc-900/40 border-emerald-500/30'
                        : isExpanded
                        ? 'bg-zinc-900/90 border-amber-500/50 shadow-md'
                        : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Step Card Header (Click to Expand/Collapse) */}
                    <div
                      onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                      className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                            {step.phaseTitle}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getDifficultyBadge(
                              step.difficulty
                            )}`}
                          >
                            {step.difficulty}
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{step.estimatedMinutes} mins</span>
                          </span>
                        </div>

                        <h4
                          className={`text-base sm:text-lg font-bold font-heading transition-colors ${
                            isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-100 group-hover:text-amber-300'
                          }`}
                        >
                          {step.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStep(step.id);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          <span>{isCompleted ? 'Done' : 'Mark Done'}</span>
                        </button>

                        <div className="text-zinc-400 p-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Step Card Expanded Body */}
                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-zinc-800/80 space-y-4 text-xs sm:text-sm">
                        {/* Key Concepts Covered */}
                        {step.keyConcepts && step.keyConcepts.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                              Core Concepts to Master:
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {step.keyConcepts.map((c, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium text-xs"
                                >
                                  🔹 {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hands-on Practical Task */}
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-amber-200">
                          <div className="flex items-center gap-1.5 font-extrabold text-amber-300 text-xs">
                            <CheckSquare className="w-4 h-4" />
                            <span>Actionable Challenge / Micro-Task:</span>
                          </div>
                          <p className="text-xs leading-relaxed text-amber-100/90">{step.practicalTask}</p>
                        </div>

                        {/* Senior Mentor Pro Tip / CBSE Trap */}
                        {step.seniorTip && (
                          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1 text-indigo-200">
                            <div className="flex items-center gap-1.5 font-extrabold text-indigo-300 text-xs">
                              <Lightbulb className="w-4 h-4 text-amber-400" />
                              <span>Senior Mentor Exam Pro-Tip:</span>
                            </div>
                            <p className="text-xs leading-relaxed text-indigo-100/90">{step.seniorTip}</p>
                          </div>
                        )}

                        {/* Bottom Actions for this Step */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80">
                          <span className="text-xs text-zinc-500">
                            Estimated Step Duration: <strong>{step.estimatedMinutes} minutes</strong>
                          </span>

                          <div className="flex items-center gap-2">
                            {onGoToQuiz && (
                              <button
                                onClick={() => onGoToQuiz(step.quizPrompt || step.title, subject)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all shadow-xs active:scale-95 cursor-pointer"
                                title="Generate a practice quiz specifically on this step's topics"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Quiz On Step {step.stepNumber} ❓</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleStep(step.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isCompleted
                                  ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black shadow-xs'
                              }`}
                            >
                              {isCompleted ? 'Mark as Incomplete' : 'Complete Step ✓'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Board Exam High-Yield Mastery Checklist */}
          {roadmap.boardExamChecklist && roadmap.boardExamChecklist.length > 0 && (
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm sm:text-base font-bold text-zinc-100 font-heading">
                    Board Exam High-Yield Checklist ({completedChecklist.length} / {roadmap.boardExamChecklist.length})
                  </h4>
                </div>
                <span className="text-xs text-zinc-400 font-semibold">
                  {completedChecklist.length === roadmap.boardExamChecklist.length
                    ? '🎉 Exam Ready!'
                    : 'Target: 100%'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {roadmap.boardExamChecklist.map((item, idx) => {
                  const isChecked = completedChecklist.includes(idx);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleChecklist(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                        isChecked
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0 text-emerald-400">
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-zinc-950" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>
                      <span className={`text-xs leading-snug ${isChecked ? 'line-through text-zinc-500' : ''}`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
