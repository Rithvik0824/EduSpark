import React, { useState, useRef, useEffect } from 'react';
import { AssignmentEvaluationResult } from '../types';
import { evaluateAssignment } from '../services/api';
import { exportEvaluationToPDF } from '../utils/pdfExport';
import { SpeechHelper } from '../utils/speech';
import { ProgressTracker } from '../utils/progressTracker';
import { triggerAssignmentConfetti } from '../utils/confetti';
import {
  CheckSquare,
  Upload,
  Sparkles,
  FileCheck,
  Award,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  BookmarkPlus,
  BookOpen,
  Send,
  Languages,
  TrendingUp,
  FileText,
  FileDown,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface AssignmentEvaluatorProps {
  onSaveToHistory: (type: 'evaluation', title: string, subject: string, data: AssignmentEvaluationResult) => void;
  initialQuestionPaper?: string;
  initialAnswerSheet?: string;
  initialSubject?: string;
  onEvaluationGenerated?: (result: AssignmentEvaluationResult) => void;
}

export const AssignmentEvaluator: React.FC<AssignmentEvaluatorProps> = ({
  onSaveToHistory,
  initialQuestionPaper,
  initialAnswerSheet,
  initialSubject,
  onEvaluationGenerated,
}) => {
  const [questionText, setQuestionText] = useState(initialQuestionPaper || '');
  const [answerText, setAnswerText] = useState(initialAnswerSheet || '');
  const [subject, setSubject] = useState(initialSubject || 'Science / Physics');
  const [classLevel, setClassLevel] = useState('Class 10 (CBSE / State)');
  const [customCriteria, setCustomCriteria] = useState('');

  // Attachments
  const [qpImage, setQpImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [ansImage, setAnsImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [ansPdf, setAnsPdf] = useState<{ base64: string; mimeType: string; name: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<AssignmentEvaluationResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingItemKey, setSpeakingItemKey] = useState<string | null>(null);

  const qpInputRef = useRef<HTMLInputElement>(null);
  const ansInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = SpeechHelper.subscribe((status, textId) => {
      setIsSpeaking(status === 'speaking');
      if (status === 'idle') {
        setSpeakingItemKey(null);
      }
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    if (initialQuestionPaper) setQuestionText(initialQuestionPaper);
    if (initialAnswerSheet) setAnswerText(initialAnswerSheet);
    if (initialSubject) setSubject(initialSubject);
  }, [initialQuestionPaper, initialAnswerSheet, initialSubject]);

  const handleQpFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setQpImage({
        base64: reader.result as string,
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAnsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        setAnsImage({
          base64: reader.result as string,
          mimeType: file.type,
          name: file.name,
        });
        setAnsPdf(null);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      reader.onload = () => {
        setAnsPdf({
          base64: reader.result as string,
          mimeType: 'application/pdf',
          name: file.name,
        });
        setAnsImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEvaluate = async () => {
    if (!questionText.trim() && !qpImage && !answerText.trim() && !ansImage && !ansPdf) {
      setError('Please provide Question Paper and Student Answer Sheet (text, images, or PDF).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    try {
      const result = await evaluateAssignment({
        questionPaperText: questionText.trim(),
        questionPaperImageBase64: qpImage?.base64,
        questionPaperMimeType: qpImage?.mimeType,
        answerSheetText: answerText.trim(),
        answerSheetImageBase64: ansImage?.base64,
        answerSheetMimeType: ansImage?.mimeType,
        answerSheetPdfBase64: ansPdf?.base64,
        answerSheetPdfMimeType: ansPdf?.mimeType,
        subject,
        classLevel,
        customCriteria,
      });

      setEvalResult(result);
      ProgressTracker.recordAssignmentEvaluated();
      if (onEvaluationGenerated) {
        onEvaluationGenerated(result);
      }
      triggerAssignmentConfetti({
        grade: result.grade,
        totalMarksAwarded: result.totalMarksAwarded,
        totalMaxMarks: result.totalMaxMarks,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to evaluate assignment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSpeakOverall = () => {
    if (!evalResult) return;
    if (isSpeaking && speakingItemKey === 'overall-feedback') {
      SpeechHelper.stop();
      setIsSpeaking(false);
      setSpeakingItemKey(null);
    } else {
      const textToRead = `Assignment Evaluation for ${evalResult.assignmentTitle}. You scored ${evalResult.totalMarksAwarded} out of ${evalResult.totalMaxMarks} marks, achieving a grade of ${evalResult.grade}. Here is your senior teacher feedback: ${evalResult.overallSeniorReview}. ${evalResult.motivationMessage}`;
      setSpeakingItemKey('overall-feedback');
      setIsSpeaking(true);
      SpeechHelper.speak(textToRead, {
        textId: 'overall-feedback',
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

  const handleSpeakQuestionReview = (q: AssignmentEvaluationResult['questionEvaluations'][0]) => {
    const itemKey = `question-${q.questionNumber}`;
    if (isSpeaking && speakingItemKey === itemKey) {
      SpeechHelper.stop();
      setIsSpeaking(false);
      setSpeakingItemKey(null);
    } else {
      const text = `Evaluation for question ${q.questionNumber}: ${q.questionText}. Marks awarded: ${q.marksAwarded} out of 10. What is good: ${q.whatIsGood}. What to improve: ${q.whatToImprove}. Suggested model answer: ${q.suggestedBetterAnswer}. Examiner tip: ${q.tipForFullMarks}`;
      setSpeakingItemKey(itemKey);
      setIsSpeaking(true);
      SpeechHelper.speak(text, {
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

  const handleCopyReport = () => {
    if (!evalResult) return;
    let content = `# Assignment Evaluation: ${evalResult.assignmentTitle}\n`;
    content += `**Total Score:** ${evalResult.totalMarksAwarded} / ${evalResult.totalMaxMarks} (${evalResult.percentage}% - Grade ${evalResult.grade})\n\n`;
    content += `## Friendly Senior Review:\n${evalResult.overallSeniorReview}\n\n`;
    content += `## Question-by-Question Evaluation (/10 Marks Each):\n`;
    evalResult.questionEvaluations.forEach((q) => {
      content += `### ${q.questionNumber}: ${q.questionText}\n`;
      content += `- **Marks:** ${q.marksAwarded} / 10\n`;
      content += `- **What's Good:** ${q.whatIsGood}\n`;
      content += `- **What to Improve:** ${q.whatToImprove}\n`;
      content += `- **Model Answer:** ${q.suggestedBetterAnswer}\n`;
      content += `- **Tip for Full Marks:** ${q.tipForFullMarks}\n\n`;
    });
    content += `## Motivation:\n${evalResult.motivationMessage}\n`;

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!evalResult) return;
    onSaveToHistory('evaluation', evalResult.assignmentTitle, evalResult.subject || subject, evalResult);
    setIsSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* Upload & Inputs Box */}
      <div className="bg-[#121215] rounded-3xl p-6 sm:p-7 border border-zinc-800/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-zinc-100 font-heading">
                Assignment Evaluator 📝
              </h2>
              <p className="text-xs text-zinc-400">
                Grades every question out of 10 marks with friendly, constructive feedback & model answers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              id="select-eval-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="Science / Physics">Physics / Science ⚡</option>
              <option value="Chemistry">Chemistry 🧪</option>
              <option value="Biology">Biology 🧬</option>
              <option value="Mathematics">Mathematics 📐</option>
              <option value="Social Science / History">History / Social 🇮🇳</option>
              <option value="English Language">English 📖</option>
            </select>

            <select
              id="select-eval-class"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="Class 10 (CBSE/State)">Class 10</option>
              <option value="Class 12 / Intermediate">Class 12 / Inter</option>
              <option value="JEE / NEET Foundation">JEE / NEET</option>
              <option value="Class 8-9 Middle School">Class 8-9</option>
              <option value="College / Engineering">College</option>
            </select>
          </div>
        </div>

        {/* Dual Input: Question Paper & Student Answer Sheet */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Question Paper Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
            <div className="flex items-center justify-between">
              <label htmlFor="qp-textarea" className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>1. Question Paper / Questions:</span>
              </label>

              <button
                type="button"
                onClick={() => qpInputRef.current?.click()}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>{qpImage ? 'Change Image' : 'Upload Image'}</span>
              </button>
              <input
                ref={qpInputRef}
                type="file"
                accept="image/*"
                onChange={handleQpFile}
                className="hidden"
                id="qp-file-input"
              />
            </div>

            {qpImage && (
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300 flex items-center justify-between">
                <span>📎 {qpImage.name}</span>
                <button
                  onClick={() => setQpImage(null)}
                  className="text-rose-400 font-bold hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            <textarea
              id="qp-textarea"
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Paste questions here (e.g. Q1. State Ohm's law. Q2. Explain heating effect...)"
              className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs placeholder:text-zinc-500 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none font-sans"
            />
          </div>

          {/* 2. Student Answer Sheet Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
            <div className="flex items-center justify-between">
              <label htmlFor="ans-textarea" className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Student Answer Sheet:</span>
              </label>

              <button
                type="button"
                onClick={() => ansInputRef.current?.click()}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>{ansImage || ansPdf ? 'Change File' : 'Upload Image / PDF'}</span>
              </button>
              <input
                ref={ansInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleAnsFile}
                className="hidden"
                id="ans-file-input"
              />
            </div>

            {(ansImage || ansPdf) && (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                <span>📎 {ansImage ? ansImage.name : ansPdf?.name}</span>
                <button
                  onClick={() => {
                    setAnsImage(null);
                    setAnsPdf(null);
                  }}
                  className="text-rose-400 font-bold hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            <textarea
              id="ans-textarea"
              rows={4}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Paste student answers here (or upload scanned notebook pages above)..."
              className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs placeholder:text-zinc-500 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none font-sans"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Marks out of 10 per answer • What's Good • What to Improve • Model Answer</span>
          </span>

          <button
            id="btn-evaluate-assignment-run"
            onClick={handleEvaluate}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Senior Mentor Evaluating...</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                <span>Evaluate Assignment 📝</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Evaluation Results Report */}
      {evalResult && (
        <div id="evaluation-report" className="space-y-6">
          {/* Grand Score & Senior Review Banner */}
          <div className="bg-[#121215] rounded-3xl p-6 sm:p-7 border border-zinc-800/90 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {evalResult.subject}
                  </span>
                  <span className="text-xs text-zinc-600">•</span>
                  <span className="text-xs text-zinc-400">Grading Report</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-100 font-heading mt-1">
                  {evalResult.assignmentTitle}
                </h3>
              </div>

              {/* Total Score Display */}
              <div className="flex items-center gap-3 bg-zinc-900/80 px-5 py-3 rounded-2xl border border-zinc-700/60">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-black text-xl shadow-xs">
                  {evalResult.grade}
                </div>
                <div>
                  <div className="text-xl font-extrabold text-zinc-100">
                    {evalResult.totalMarksAwarded} / {evalResult.totalMaxMarks} Marks
                  </div>
                  <div className="text-xs font-bold text-emerald-400">
                    {evalResult.percentage}% Score
                  </div>
                </div>
              </div>
            </div>

            {/* Senior Teacher Review */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-emerald-300 block">Friendly Senior Teacher Review: </span>
                <p className="mt-0.5 leading-relaxed text-zinc-300">{evalResult.overallSeniorReview}</p>
              </div>
            </div>

            {/* Motivation Message */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
              <Award className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-300 block">Motivation & Encouragement: </span>
                <p className="mt-0.5 leading-relaxed text-zinc-300">{evalResult.motivationMessage}</p>
              </div>
            </div>

            {/* Utility Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-celebrate-eval"
                  onClick={() =>
                    triggerAssignmentConfetti({
                      grade: evalResult.grade,
                      totalMarksAwarded: evalResult.totalMarksAwarded,
                      totalMaxMarks: evalResult.totalMaxMarks,
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Celebrate evaluation results with confetti"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Celebrate! 🎉</span>
                </button>

                <button
                  id="btn-export-pdf-eval"
                  onClick={() => evalResult && exportEvaluationToPDF(evalResult)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors cursor-pointer"
                  title="Export evaluation report as clean PDF document"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download PDF</span>
                </button>

                <button
                  id="btn-listen-eval"
                  onClick={handleToggleSpeakOverall}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isSpeaking && speakingItemKey === 'overall-feedback'
                      ? 'bg-rose-950/40 text-rose-300 border-rose-700 animate-pulse'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                  title="Listen to teacher feedback out loud"
                >
                  {isSpeaking && speakingItemKey === 'overall-feedback' ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>
                    {isSpeaking && speakingItemKey === 'overall-feedback'
                      ? 'Stop Audio'
                      : 'Listen Feedback 🔊'}
                  </span>
                </button>

                <button
                  id="btn-copy-eval"
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Report Copied!' : 'Copy Report'}</span>
                </button>

                <button
                  id="btn-save-eval"
                  onClick={handleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Saved! ✨' : 'Save Report'}</span>
                </button>
              </div>

              <span className="text-xs text-zinc-500 font-medium">
                {evalResult.questionEvaluations.length} Questions Evaluated
              </span>
            </div>
          </div>

          {/* Question-by-Question Breakdown (Marks out of 10 for each) */}
          <div className="space-y-4">
            <h4 className="text-base font-extrabold text-zinc-100 font-heading px-1">
              Detailed Question-by-Question Evaluation (10 Marks Each):
            </h4>

            {evalResult.questionEvaluations.map((q, idx) => (
              <div
                key={idx}
                id={`eval-question-${idx}`}
                className="bg-[#121215] rounded-3xl p-5 sm:p-6 border border-zinc-800/90 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                  <div className="flex items-start gap-2.5">
                    <span className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-extrabold flex-shrink-0">
                      {q.questionNumber}
                    </span>
                    <div>
                      <h5 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug">
                        {q.questionText}
                      </h5>
                    </div>
                  </div>

                  {/* Marks out of 10 badge & listen button */}
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <button
                      id={`btn-listen-q-${idx}`}
                      onClick={() => handleSpeakQuestionReview(q)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isSpeaking && speakingItemKey === `question-${q.questionNumber}`
                          ? 'bg-rose-950/40 text-rose-300 border-rose-700 animate-pulse'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
                      }`}
                      title="Listen to this question evaluation"
                    >
                      {isSpeaking && speakingItemKey === `question-${q.questionNumber}` ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>
                        {isSpeaking && speakingItemKey === `question-${q.questionNumber}`
                          ? 'Stop'
                          : 'Read Aloud'}
                      </span>
                    </button>

                    <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-black text-sm">
                      {q.marksAwarded} / 10 Marks
                    </div>
                  </div>
                </div>

                {/* Student's answer excerpt if provided */}
                {q.studentAnswerText && (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                    <span className="font-bold text-zinc-200 block mb-0.5">Student's Submitted Answer:</span>
                    <p className="italic">"{q.studentAnswerText}"</p>
                  </div>
                )}

                {/* Structured Feedback Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* What is Good */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                    <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                      👍 What is Good:
                    </span>
                    <p className="text-zinc-300 leading-relaxed">{q.whatIsGood}</p>
                  </div>

                  {/* What to Improve */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                      💡 What to Improve:
                    </span>
                    <p className="text-zinc-300 leading-relaxed">{q.whatToImprove}</p>
                  </div>
                </div>

                {/* Suggested Better / Model Answer */}
                <div className="p-4 rounded-2xl bg-[#0D0D10] border border-zinc-800 text-xs space-y-1.5">
                  <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                    🌟 Suggested Model Answer (to get 10/10):
                  </span>
                  <p className="text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
                    {q.suggestedBetterAnswer}
                  </p>
                </div>

                {/* Tip for Full Marks */}
                <div className="text-[11px] text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span><strong className="text-zinc-300">Examiner Secret: </strong>{q.tipForFullMarks}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Items to Score More */}
          {evalResult.keyActionItemsToScoreMore && (
            <div className="bg-[#121215] rounded-3xl p-6 border border-zinc-800/90 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h4 className="text-base font-extrabold text-zinc-100 font-heading">
                  Top Action Items to Boost Your Score:
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {evalResult.keyActionItemsToScoreMore.map((item, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs flex items-start gap-2">
                    <span className="w-5 h-5 rounded-lg bg-amber-500 text-zinc-950 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      {i + 1}
                    </span>
                    <span className="text-zinc-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Telugu Motivational Summary */}
          {evalResult.teluguSummary && (
            <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-purple-950/30 rounded-3xl p-5 border border-indigo-500/30 shadow-sm">
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-indigo-500/20">
                <Languages className="w-4 h-4 text-indigo-400" />
                <h5 className="text-xs font-bold text-indigo-300 font-telugu">
                  తెలుగులో ప్రోత్సాహం (Telugu Senior Motivation):
                </h5>
              </div>
              <p className="text-xs text-zinc-200 font-telugu leading-relaxed">
                {evalResult.teluguSummary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
