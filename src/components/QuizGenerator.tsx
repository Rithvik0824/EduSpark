import React, { useState, useEffect } from 'react';
import { QuizData, QuizMCQ, SingleAnswerEvaluation } from '../types';
import { generateQuiz, evaluateSingleAnswer } from '../services/api';
import { exportQuizToPDF } from '../utils/pdfExport';
import { SpeechHelper } from '../utils/speech';
import { triggerQuizConfetti, fireDistinctionCelebration } from '../utils/confetti';
import { ProgressTracker } from '../utils/progressTracker';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Award,
  RefreshCw,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  BookOpen,
  Volume2,
  VolumeX,
  FileText,
  FileDown,
} from 'lucide-react';

interface QuizGeneratorProps {
  initialTopic?: string;
  initialSubject?: string;
  onSaveToHistory: (type: 'quiz', title: string, subject: string, data: QuizData) => void;
  onSwitchToSummarizer?: (topicText: string) => void;
  onQuizGenerated?: (quiz: QuizData) => void;
}

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({
  initialTopic,
  initialSubject,
  onSaveToHistory,
  onSwitchToSummarizer,
  onQuizGenerated,
}) => {
  const [topicInput, setTopicInput] = useState(initialTopic || '');
  const [subject, setSubject] = useState(initialSubject || 'Science / General');
  const [difficulty, setDifficulty] = useState<'Mix' | 'Easy' | 'Medium' | 'Hard'>('Mix');
  const [classLevel, setClassLevel] = useState('Class 10 (CBSE / State)');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  // User interactive answers for MCQs
  const [selectedMCQAnswers, setSelectedMCQAnswers] = useState<Record<number, number>>({});
  const [showMCQExplanations, setShowMCQExplanations] = useState<Record<number, boolean>>({});

  // Student inputs for Short Answers
  const [shortAnswersInput, setShortAnswersInput] = useState<Record<number, string>>({});
  const [shortAnswerEvaluations, setShortAnswerEvaluations] = useState<Record<number, SingleAnswerEvaluation>>({});
  const [evaluatingShortId, setEvaluatingShortId] = useState<number | null>(null);

  // Student input for Long Answer
  const [longAnswerInput, setLongAnswerInput] = useState('');
  const [longAnswerEvaluation, setLongAnswerEvaluation] = useState<SingleAnswerEvaluation | null>(null);
  const [evaluatingLong, setEvaluatingLong] = useState(false);

  // Final Test Submitted & Score Card
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingItemKey, setSpeakingItemKey] = useState<string | null>(null);

  useEffect(() => {
    const unsub = SpeechHelper.subscribe((status, textId) => {
      setIsSpeaking(status === 'speaking');
      if (status === 'idle') {
        setSpeakingItemKey(null);
      }
    });
    return unsub;
  }, []);

  const handleSpeakMCQ = (mcq: QuizMCQ, idx: number, isAnswered: boolean) => {
    const itemKey = `mcq-${mcq.id}`;
    if (isSpeaking && speakingItemKey === itemKey) {
      SpeechHelper.stop();
      setIsSpeaking(false);
      setSpeakingItemKey(null);
    } else {
      let textToRead = `Question ${idx + 1}: ${mcq.question}. Options: Option A: ${mcq.options[0]}. Option B: ${mcq.options[1]}. Option C: ${mcq.options[2]}. Option D: ${mcq.options[3]}.`;
      if (isAnswered) {
        textToRead += ` The correct answer is Option ${String.fromCharCode(65 + mcq.correctOptionIndex)}: ${mcq.options[mcq.correctOptionIndex]}. Explanation: ${mcq.explanation}.`;
      }
      setSpeakingItemKey(itemKey);
      setIsSpeaking(true);
      SpeechHelper.speak(textToRead, {
        textId: itemKey,
        lang: 'en-IN',
        onEnd: () => {
          setIsSpeaking(false);
          setSpeakingItemKey(null);
        },
        onError: () => {
          setIsSpeaking(false);
          setSpeakingItemKey(null);
        },
      });
    }
  };

  const handleSpeakTeluguExplanation = (mcqId: number, teluguText: string) => {
    const itemKey = `mcq-te-${mcqId}`;
    if (isSpeaking && speakingItemKey === itemKey) {
      SpeechHelper.stop();
      setIsSpeaking(false);
      setSpeakingItemKey(null);
    } else {
      setSpeakingItemKey(itemKey);
      setIsSpeaking(true);
      SpeechHelper.speak(teluguText, {
        textId: itemKey,
        lang: 'te-IN',
        onEnd: () => {
          setIsSpeaking(false);
          setSpeakingItemKey(null);
        },
        onError: () => {
          setIsSpeaking(false);
          setSpeakingItemKey(null);
        },
      });
    }
  };

  const handleSpeakQuizSeniorTip = () => {
    if (!quizData?.seniorTip) return;
    const itemKey = 'quiz-senior-tip';
    if (isSpeaking && speakingItemKey === itemKey) {
      SpeechHelper.stop();
      setIsSpeaking(false);
      setSpeakingItemKey(null);
    } else {
      setSpeakingItemKey(itemKey);
      setIsSpeaking(true);
      SpeechHelper.speak(`Senior Exam Strategy: ${quizData.seniorTip}`, {
        textId: itemKey,
        lang: 'en-IN',
        onEnd: () => {
          setIsSpeaking(false);
          setSpeakingItemKey(null);
        },
        onError: () => {
          setIsSpeaking(false);
          setSpeakingItemKey(null);
        },
      });
    }
  };

  React.useEffect(() => {
    if (initialTopic) {
      setTopicInput(initialTopic);
      if (initialSubject) setSubject(initialSubject);
    }
  }, [initialTopic, initialSubject]);

  const handleGenerateQuiz = async () => {
    if (!topicInput.trim()) {
      setError('Please enter a topic name, chapter syllabus, or notes text to generate your quiz.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedMCQAnswers({});
    setShowMCQExplanations({});
    setShortAnswersInput({});
    setShortAnswerEvaluations({});
    setLongAnswerInput('');
    setLongAnswerEvaluation(null);
    setIsQuizSubmitted(false);
    setIsSaved(false);

    try {
      const data = await generateQuiz({
        topicOrNotes: topicInput.trim(),
        subject,
        classLevel,
        difficulty,
      });
      setQuizData(data);
      if (onQuizGenerated) {
        onQuizGenerated(data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMCQOption = (mcqId: number, optionIdx: number) => {
    if (isQuizSubmitted) return;
    setSelectedMCQAnswers((prev) => ({ ...prev, [mcqId]: optionIdx }));
    // Auto-reveal explanation
    setShowMCQExplanations((prev) => ({ ...prev, [mcqId]: true }));
  };

  const handleEvaluateShortAnswer = async (shortId: number, question: string, modelAnswer: string) => {
    const studentText = shortAnswersInput[shortId];
    if (!studentText || !studentText.trim()) {
      alert('Please type your answer before submitting for evaluation!');
      return;
    }

    setEvaluatingShortId(shortId);
    try {
      const evaluation = await evaluateSingleAnswer({
        question,
        studentAnswer: studentText.trim(),
        maxMarks: 3,
        modelAnswer,
      });
      setShortAnswerEvaluations((prev) => ({ ...prev, [shortId]: evaluation }));
    } catch (err: any) {
      alert(err.message || 'Failed to evaluate answer.');
    } finally {
      setEvaluatingShortId(null);
    }
  };

  const handleEvaluateLongAnswer = async (question: string, modelAnswer: string, rubric: string[]) => {
    if (!longAnswerInput || !longAnswerInput.trim()) {
      alert('Please write your detailed response first!');
      return;
    }

    setEvaluatingLong(true);
    try {
      const evaluation = await evaluateSingleAnswer({
        question,
        studentAnswer: longAnswerInput.trim(),
        maxMarks: 5,
        modelAnswer,
        rubric,
      });
      setLongAnswerEvaluation(evaluation);
    } catch (err: any) {
      alert(err.message || 'Failed to evaluate answer.');
    } finally {
      setEvaluatingLong(false);
    }
  };

  const handleFinishQuiz = () => {
    if (!quizData) return;

    // Check if at least some MCQs were attempted
    const attemptedCount = Object.keys(selectedMCQAnswers).length;
    if (attemptedCount < quizData.mcqs.length) {
      if (!confirm(`You have only attempted ${attemptedCount} out of ${quizData.mcqs.length} MCQs. Do you want to submit anyway?`)) {
        return;
      }
    }

    setIsQuizSubmitted(true);

    // Calculate score earned
    const calcMcqScore = quizData.mcqs.reduce((acc, mcq) => {
      return selectedMCQAnswers[mcq.id] === mcq.correctOptionIndex ? acc + 1 : acc;
    }, 0);
    const calcShortScore = Object.values(shortAnswerEvaluations).reduce(
      (acc, ev) => acc + (ev.marksAwarded || 0),
      0
    );
    const calcLongScore = longAnswerEvaluation ? longAnswerEvaluation.marksAwarded || 0 : 0;
    const calcEarned = calcMcqScore + calcShortScore + calcLongScore;
    const calcMax = (quizData.mcqs.length || 5) * 1 + (quizData.shortAnswers.length || 2) * 3 + 5;
    const calcPct = Math.round((calcEarned / (calcMax || 1)) * 100);

    // Auto-record attempt in study progress ledger
    ProgressTracker.recordQuizCompleted({
      title: quizData.title || `${subject || 'General'} Quiz`,
      subject: quizData.subject || subject || 'General Science',
      earnedScore: calcEarned,
      maxScore: calcMax,
      percentage: calcPct,
      difficulty: difficulty,
      durationSeconds: 300,
    });

    // Trigger rich celebratory confetti tailored to performance
    triggerQuizConfetti({
      percentage: calcPct,
      earnedScore: calcEarned,
      maxScore: calcMax,
    });
  };

  // Calculate scores
  const mcqScore = quizData
    ? quizData.mcqs.reduce((acc, mcq) => {
        return selectedMCQAnswers[mcq.id] === mcq.correctOptionIndex ? acc + 1 : acc;
      }, 0)
    : 0;

  const shortScore = Object.values(shortAnswerEvaluations).reduce((acc, ev) => acc + (ev.marksAwarded || 0), 0);
  const longScore = longAnswerEvaluation ? longAnswerEvaluation.marksAwarded || 0 : 0;
  const totalEarned = mcqScore + shortScore + longScore;
  const totalMax = (quizData?.mcqs.length || 5) * 1 + (quizData?.shortAnswers.length || 2) * 3 + 5; // e.g. 5 + 6 + 5 = 16 marks

  const handleSave = () => {
    if (!quizData) return;
    onSaveToHistory('quiz', quizData.title, quizData.subject || subject, quizData);
    setIsSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* Quiz Setup & Input Card */}
      <div className="bg-[#121215] rounded-3xl p-6 sm:p-7 border border-zinc-800/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-zinc-100 font-heading">
                Quiz Generator ❓
              </h2>
              <p className="text-xs text-zinc-400">
                Generates 5 MCQs + 2 Short Answers + 1 Long Answer with instant AI grading
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              id="select-quiz-diff"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="Mix">Mix (Easy, Med, Hard) ⚖️</option>
              <option value="Easy">Easy (Conceptual Basics) 🌱</option>
              <option value="Medium">Medium (Standard Board) 🎯</option>
              <option value="Hard">Hard (JEE / Advanced) 🔥</option>
            </select>

            <select
              id="select-quiz-class"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="Class 10 (CBSE/State)">Class 10</option>
              <option value="Class 12 / Inter">Class 12 / Inter</option>
              <option value="JEE / NEET">JEE / NEET</option>
              <option value="Degree / B.Tech">Degree / B.Tech</option>
            </select>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="quiz-topic-input" className="text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Chapter Topic or Paste Study Content:</span>
              <span className="text-[11px] text-zinc-500 font-normal">
                e.g. CBSE 10th Electricity, Indian Constitution, Organic Reactions
              </span>
            </label>
            <textarea
              id="quiz-topic-input"
              rows={3}
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Enter chapter name (e.g. Photosynthesis, Chemical Reactions & Equations, Laws of Motion) or paste extracted notes here..."
              className="w-full p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-sm placeholder:text-zinc-500 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none font-sans"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Generates 5 MCQs (4 choices) + 2 Short (3M) + 1 Long (5M)</span>
            </div>

            <button
              id="btn-generate-quiz"
              onClick={handleGenerateQuiz}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Crafting Diagnostic Quiz...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Quiz ❓</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Quiz Test Engine */}
      {quizData && (
        <div id="quiz-active-section" className="space-y-6">
          {/* Header & Score Tracker */}
          <div className="bg-[#121215] rounded-3xl p-6 border border-zinc-800/90 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    {quizData.subject}
                  </span>
                  <span className="text-xs text-zinc-600">•</span>
                  <span className="text-xs text-zinc-400">{quizData.difficultySummary}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-100 font-heading mt-1">
                  {quizData.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-listen-quiz-strategy"
                  onClick={handleSpeakQuizSeniorTip}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isSpeaking && speakingItemKey === 'quiz-senior-tip'
                      ? 'bg-rose-950/40 text-rose-300 border-rose-700 animate-pulse'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                  title="Listen to Senior exam strategy"
                >
                  {isSpeaking && speakingItemKey === 'quiz-senior-tip' ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>
                    {isSpeaking && speakingItemKey === 'quiz-senior-tip'
                      ? 'Stop Audio'
                      : 'Listen Strategy 🔊'}
                  </span>
                </button>

                <button
                  id="btn-export-pdf-quiz"
                  onClick={() => quizData && exportQuizToPDF(quizData, true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 hover:text-indigo-200 transition-colors cursor-pointer"
                  title="Export complete quiz worksheet and solutions to PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download PDF</span>
                </button>

                <button
                  id="btn-save-quiz"
                  onClick={handleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Saved! ✨' : 'Save Quiz'}</span>
                </button>
              </div>
            </div>

            {/* Senior Tip */}
            <div className="mt-4 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 flex items-start gap-2.5 text-xs">
              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-300">Senior Strategy: </span>
                <span>{quizData.seniorTip}</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: 5 MCQs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-base font-extrabold text-zinc-100 font-heading flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span>Section A: 5 Multiple Choice Questions (1 Mark Each)</span>
              </h4>
              <span className="text-xs font-bold text-zinc-400">
                Attempted: {Object.keys(selectedMCQAnswers).length} / {quizData.mcqs.length}
              </span>
            </div>

            {quizData.mcqs.map((mcq, idx) => {
              const selectedIdx = selectedMCQAnswers[mcq.id];
              const isAnswered = selectedIdx !== undefined;
              const isCorrect = selectedIdx === mcq.correctOptionIndex;

              return (
                <div
                  key={mcq.id}
                  id={`mcq-card-${mcq.id}`}
                  className="bg-[#121215] rounded-3xl p-5 sm:p-6 border border-zinc-800/90 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-extrabold flex-shrink-0">
                        Q{idx + 1}
                      </span>
                      <h5 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug">
                        {mcq.question}
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id={`btn-read-mcq-${mcq.id}`}
                        onClick={() => handleSpeakMCQ(mcq, idx, isAnswered)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          isSpeaking && speakingItemKey === `mcq-${mcq.id}`
                            ? 'bg-rose-950/40 text-rose-300 border-rose-700 animate-pulse'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
                        }`}
                        title="Read question and options aloud"
                      >
                        {isSpeaking && speakingItemKey === `mcq-${mcq.id}` ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>
                          {isSpeaking && speakingItemKey === `mcq-${mcq.id}`
                            ? 'Stop'
                            : 'Read Aloud'}
                        </span>
                      </button>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          mcq.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : mcq.difficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {mcq.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {mcq.options.map((option, optIdx) => {
                      const isSelected = selectedIdx === optIdx;
                      const isTargetCorrect = optIdx === mcq.correctOptionIndex;

                      let btnStyle = 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100';
                      if (isAnswered) {
                        if (isTargetCorrect) {
                          btnStyle = 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200 font-bold shadow-xs';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-950/50 border-rose-500/60 text-rose-200';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          id={`mcq-${mcq.id}-opt-${optIdx}`}
                          onClick={() => handleSelectMCQOption(mcq.id, optIdx)}
                          className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 cursor-pointer ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1">{option}</span>
                          {isAnswered && isTargetCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                          {isAnswered && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Solution & Telugu Explanation */}
                  {showMCQExplanations[mcq.id] && (
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        {isCorrect ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Correct Answer! (+1 Mark)
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Incorrect. Correct is Option {String.fromCharCode(65 + mcq.correctOptionIndex)}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-300 leading-relaxed">
                        <strong className="text-zinc-100">Explanation: </strong>
                        {mcq.explanation}
                      </p>
                      {mcq.teluguExplanation && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800">
                          <p className="text-indigo-300 font-telugu text-[11px] flex-1">
                            <strong>తెలుగు వివరణ:</strong> {mcq.teluguExplanation}
                          </p>
                          <button
                            id={`btn-listen-te-mcq-${mcq.id}`}
                            onClick={() => handleSpeakTeluguExplanation(mcq.id, mcq.teluguExplanation || '')}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer flex-shrink-0 ${
                              isSpeaking && speakingItemKey === `mcq-te-${mcq.id}`
                                ? 'bg-rose-950/40 text-rose-300 border-rose-700 animate-pulse'
                                : 'bg-zinc-800 text-indigo-300 border-indigo-500/30 hover:bg-zinc-700'
                            }`}
                            title="Listen in Telugu"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>వినండి 🔊</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SECTION 2: 2 Short Answer Questions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-base font-extrabold text-zinc-100 font-heading flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500 text-zinc-950 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span>Section B: 2 Short Answer Questions (3 Marks Each)</span>
              </h4>
            </div>

            {quizData.shortAnswers.map((sq, idx) => {
              const evalResult = shortAnswerEvaluations[sq.id];
              const isEvaluating = evaluatingShortId === sq.id;

              return (
                <div
                  key={sq.id}
                  id={`short-q-${sq.id}`}
                  className="bg-[#121215] rounded-3xl p-5 sm:p-6 border border-zinc-800/90 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-extrabold flex-shrink-0">
                        Q{idx + 1}
                      </span>
                      <h5 className="text-sm sm:text-base font-bold text-zinc-100">
                        {sq.question}
                      </h5>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold whitespace-nowrap">
                      {sq.maxMarks} Marks
                    </span>
                  </div>

                  {/* Student text input */}
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={shortAnswersInput[sq.id] || ''}
                      onChange={(e) =>
                        setShortAnswersInput((prev) => ({ ...prev, [sq.id]: e.target.value }))
                      }
                      placeholder="Type your brief answer here in 2-4 lines..."
                      className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs sm:text-sm placeholder:text-zinc-500 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[11px] text-zinc-400">
                        Keywords to include: {sq.keyPointsNeeded.slice(0, 3).join(', ')}
                      </div>

                      <button
                        id={`btn-evaluate-short-${sq.id}`}
                        onClick={() => handleEvaluateShortAnswer(sq.id, sq.question, sq.modelAnswer)}
                        disabled={isEvaluating}
                        className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isEvaluating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Senior AI Evaluating...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Evaluate Answer ✨</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Evaluation result for this Short Answer */}
                  {evalResult && (
                    <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-indigo-300 flex items-center gap-1.5 text-sm">
                          <Award className="w-4 h-4 text-amber-400" />
                          Marks Awarded: {evalResult.marksAwarded} / {evalResult.maxMarks}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const text = `Feedback for ${sq.question}. Marks awarded: ${evalResult.marksAwarded} out of ${evalResult.maxMarks}. Praise: ${evalResult.seniorPraise}. What is good: ${evalResult.feedbackGood}. What to improve: ${evalResult.feedbackImprove}. Model answer: ${evalResult.modelAnswer}`;
                              SpeechHelper.speak(text, { textId: `short-eval-${sq.id}`, lang: 'en-IN' });
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-zinc-900 text-indigo-300 border border-indigo-500/30 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Listen to feedback"
                          >
                            <Volume2 className="w-3 h-3 text-indigo-400" />
                            <span>Listen Feedback 🔊</span>
                          </button>
                          <span className="text-[11px] font-bold text-indigo-400">
                            {evalResult.seniorPraise}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-emerald-400">
                          <strong>👍 What's Good: </strong> {evalResult.feedbackGood}
                        </p>
                        <p className="text-amber-300">
                          <strong>💡 What to Improve: </strong> {evalResult.feedbackImprove}
                        </p>
                        <div className="p-2.5 rounded-xl bg-[#0D0D10] border border-zinc-800 mt-2">
                          <strong className="text-zinc-200 block mb-0.5">Reference Model Answer:</strong>
                          <span className="text-zinc-300">{evalResult.modelAnswer}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SECTION 3: 1 Long Answer Question */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-base font-extrabold text-zinc-100 font-heading flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500 text-zinc-950 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span>Section C: 1 Comprehensive Long Answer (5 Marks)</span>
              </h4>
            </div>

            <div className="bg-[#121215] rounded-3xl p-5 sm:p-6 border border-zinc-800/90 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-extrabold flex-shrink-0">
                    Q1
                  </span>
                  <h5 className="text-sm sm:text-base font-bold text-zinc-100">
                    {quizData.longAnswer.question}
                  </h5>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold whitespace-nowrap">
                  {quizData.longAnswer.maxMarks} Marks
                </span>
              </div>

              <textarea
                rows={5}
                value={longAnswerInput}
                onChange={(e) => setLongAnswerInput(e.target.value)}
                placeholder="Write your in-depth conceptual explanation, derivations, or step-by-step points..."
                className="w-full p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs sm:text-sm placeholder:text-zinc-500 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-[11px] text-zinc-400">
                  Rubric: {quizData.longAnswer.evaluationRubric.slice(0, 2).join(' • ')}
                </div>

                <button
                  id="btn-evaluate-long-ans"
                  onClick={() =>
                    handleEvaluateLongAnswer(
                      quizData.longAnswer.question,
                      quizData.longAnswer.modelAnswer,
                      quizData.longAnswer.evaluationRubric
                    )
                  }
                  disabled={evaluatingLong}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {evaluatingLong ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Grading Long Answer...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Evaluate Long Answer ✨</span>
                    </>
                  )}
                </button>
              </div>

              {/* Long answer evaluation result */}
              {longAnswerEvaluation && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-purple-300 flex items-center gap-1.5 text-sm">
                      <Award className="w-4 h-4 text-amber-400" />
                      Score: {longAnswerEvaluation.marksAwarded} / {longAnswerEvaluation.maxMarks}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const text = `Long Answer Evaluation. Score: ${longAnswerEvaluation.marksAwarded} out of ${longAnswerEvaluation.maxMarks}. Praise: ${longAnswerEvaluation.seniorPraise}. Strengths: ${longAnswerEvaluation.feedbackGood}. Examiner feedback: ${longAnswerEvaluation.feedbackImprove}. Model answer: ${longAnswerEvaluation.modelAnswer}`;
                          SpeechHelper.speak(text, { textId: 'long-eval', lang: 'en-IN' });
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-zinc-900 text-purple-300 border border-purple-500/30 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Listen to long answer feedback"
                      >
                        <Volume2 className="w-3 h-3 text-purple-400" />
                        <span>Listen Feedback 🔊</span>
                      </button>
                      <span className="text-[11px] font-bold text-purple-400">
                        {longAnswerEvaluation.seniorPraise}
                      </span>
                    </div>
                  </div>

                  <p className="text-emerald-400">
                    <strong>👍 Strengths: </strong> {longAnswerEvaluation.feedbackGood}
                  </p>
                  <p className="text-amber-300">
                    <strong>💡 Examiner Improvement Areas: </strong>{' '}
                    {longAnswerEvaluation.feedbackImprove}
                  </p>
                  <div className="p-3 rounded-xl bg-[#0D0D10] border border-zinc-800 mt-2">
                    <strong className="text-purple-300 block mb-1">Model Long Answer:</strong>
                    <span className="text-zinc-200 leading-relaxed">
                      {longAnswerEvaluation.modelAnswer}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Test Button / Score Summary Banner */}
          {!isQuizSubmitted ? (
            <div className="p-6 rounded-3xl bg-[#121215] border border-zinc-800/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-extrabold text-zinc-100 font-heading">
                  Ready to check your total quiz result?
                </h4>
                <p className="text-xs text-zinc-400">
                  MCQ Score: {mcqScore} / 5 | Evaluated Written Answers: {shortScore + longScore} Marks
                </p>
              </div>

              <button
                id="btn-submit-final-quiz"
                onClick={handleFinishQuiz}
                className="px-6 py-3 rounded-2xl text-sm font-extrabold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
              >
                Submit Quiz & Get Score Card 🏆
              </button>
            </div>
          ) : (
            /* Completed Score Card */
            <div id="quiz-final-scorecard" className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 border border-indigo-500/30 text-white shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-700/60">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-zinc-950">
                    <Award className="w-4 h-4" />
                    <span>Official Quiz Score Card</span>
                  </div>
                  <h3 className="text-2xl font-extrabold font-heading text-zinc-100">
                    {totalEarned >= totalMax * 0.8
                      ? 'Outstanding Performance! 🏆'
                      : totalEarned >= totalMax * 0.5
                      ? 'Good Effort! Keep Pushing ⭐'
                      : 'Revision Needed! You will crack it! 💪'}
                  </h3>
                </div>

                {/* Score Dial */}
                <div className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-zinc-700/60">
                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-400">
                      {totalEarned} / {totalMax}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      ({Math.round((totalEarned / totalMax) * 100)}% Marks)
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-indigo-400 block mb-1 font-semibold">Section A (MCQs)</span>
                  <span className="text-lg font-bold text-zinc-100">{mcqScore} / 5</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-indigo-400 block mb-1 font-semibold">Section B (Short)</span>
                  <span className="text-lg font-bold text-zinc-100">{shortScore} / 6</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-indigo-400 block mb-1 font-semibold">Section C (Long)</span>
                  <span className="text-lg font-bold text-zinc-100">{longScore} / 5</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    id="btn-celebrate-quiz-score"
                    onClick={() =>
                      triggerQuizConfetti({
                        percentage: Math.round((totalEarned / totalMax) * 100),
                        earnedScore: totalEarned,
                        maxScore: totalMax,
                      })
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all shadow-sm active:scale-95 cursor-pointer"
                    title="Celebrate with confetti fireworks"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Celebrate! 🎉</span>
                  </button>

                  <button
                    id="btn-retry-quiz"
                    onClick={() => {
                      setIsQuizSubmitted(false);
                      setSelectedMCQAnswers({});
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer border border-zinc-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Quiz</span>
                  </button>

                  <button
                    id="btn-export-scorecard-pdf"
                    onClick={() => quizData && exportQuizToPDF(quizData, true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 transition-colors cursor-pointer border border-indigo-500/40"
                  >
                    <FileDown className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Download Quiz PDF</span>
                  </button>
                </div>

                {onSwitchToSummarizer && (
                  <button
                    onClick={() => onSwitchToSummarizer(topicInput)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Notes Summary for this Topic 📄</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
