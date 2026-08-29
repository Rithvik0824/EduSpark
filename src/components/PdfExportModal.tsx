import React, { useState } from 'react';
import { NotesSummaryResult, QuizData, AssignmentEvaluationResult, SuperpowerTab } from '../types';
import { exportSummaryToPDF, exportQuizToPDF, exportEvaluationToPDF } from '../utils/pdfExport';
import { FileDown, X, Check, FileText, HelpCircle, CheckSquare, Sparkles, Download, Layers } from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: SuperpowerTab;
  currentSummary?: NotesSummaryResult | null;
  currentQuiz?: QuizData | null;
  currentEvaluation?: AssignmentEvaluationResult | null;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  currentSummary,
  currentQuiz,
  currentEvaluation,
}) => {
  const [includeQuizAnswers, setIncludeQuizAnswers] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async (type: 'summary' | 'quiz' | 'eval') => {
    setIsExporting(true);
    setExportedSuccess(false);

    try {
      if (type === 'summary' && currentSummary) {
        exportSummaryToPDF(currentSummary);
      } else if (type === 'quiz' && currentQuiz) {
        exportQuizToPDF(currentQuiz, includeQuizAnswers);
      } else if (type === 'eval' && currentEvaluation) {
        exportEvaluationToPDF(currentEvaluation);
      }
      setExportedSuccess(true);
      setTimeout(() => {
        setExportedSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-zinc-800/90 flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800/80 flex items-center justify-between bg-[#121215]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-zinc-100 font-heading">
                Export to Printable PDF 📥
              </h3>
              <p className="text-xs text-zinc-400">
                High-yield revision sheets & diagnostic worksheets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Notes Summary Export Card */}
          {currentSummary && (
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                      Notes Summary Ready
                    </span>
                    <h4 className="text-sm font-bold text-zinc-100">{currentSummary.title}</h4>
                    <p className="text-xs text-zinc-400">{currentSummary.subject} • 5-Points, Q&A, Formulas</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleExport('summary')}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 transition-all cursor-pointer shadow-sm"
              >
                {exportedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Downloaded Successfully!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Summary PDF (A4)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quiz Export Card */}
          {currentQuiz && (
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
                      Quiz Worksheet Ready
                    </span>
                    <h4 className="text-sm font-bold text-zinc-100">{currentQuiz.title}</h4>
                    <p className="text-xs text-zinc-400">
                      {currentQuiz.mcqs?.length || 0} MCQs, {currentQuiz.shortAnswers?.length || 0} Short, 1 Long Question
                    </p>
                  </div>
                </div>
              </div>

              {/* Quiz option: Include answers or blank question paper */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs">
                <span className="text-zinc-300 font-medium">Include Answer Key & Explanations:</span>
                <button
                  type="button"
                  onClick={() => setIncludeQuizAnswers(!includeQuizAnswers)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                    includeQuizAnswers
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {includeQuizAnswers ? 'Yes (Full Solutions)' : 'No (Blank Question Paper)'}
                </button>
              </div>

              <button
                onClick={() => handleExport('quiz')}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Quiz Worksheet PDF</span>
              </button>
            </div>
          )}

          {/* Assignment Evaluation Export Card */}
          {currentEvaluation && (
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                      Evaluation Report Ready
                    </span>
                    <h4 className="text-sm font-bold text-zinc-100">{currentEvaluation.assignmentTitle}</h4>
                    <p className="text-xs text-zinc-400">
                      Score: {currentEvaluation.totalMarksAwarded}/{currentEvaluation.totalMaxMarks} ({currentEvaluation.percentage}%) • Grade: {currentEvaluation.grade}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleExport('eval')}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Evaluation Report PDF</span>
              </button>
            </div>
          )}

          {!currentSummary && !currentQuiz && !currentEvaluation && (
            <div className="text-center py-8 space-y-2">
              <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-300">No active generated content yet.</p>
              <p className="text-xs text-zinc-500">
                Generate a Summary, Quiz, or Assignment Evaluation first to export clean PDF sheets!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#0C0C0E] flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Standard A4 Vector PDF with Page Numbers</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
