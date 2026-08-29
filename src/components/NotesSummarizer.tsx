import React, { useState, useEffect, useRef } from 'react';
import { NotesSummaryResult } from '../types';
import { summarizeNotes } from '../services/api';
import { SpeechHelper } from '../utils/speech';
import { exportSummaryToPDF } from '../utils/pdfExport';
import { ProgressTracker } from '../utils/progressTracker';
import { RecommendedResources } from './RecommendedResources';
import { StudyRoadmapView } from './StudyRoadmapView';
import { ConceptGraphVisualizer } from './ConceptGraphVisualizer';
import {
  FileText,
  Upload,
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  HelpCircle,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Zap,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
  Languages,
  BookmarkPlus,
  AlertCircle,
  FileCheck,
  Hash,
  FileDown,
  Compass,
  Network,
} from 'lucide-react';

interface NotesSummarizerProps {
  onGoToQuiz: (topicOrNotes: string, subject?: string) => void;
  onSaveToHistory: (type: 'summary', title: string, subject: string, data: NotesSummaryResult) => void;
  initialTopicData?: { text: string; subject?: string; title?: string };
  onSummaryGenerated?: (summary: NotesSummaryResult) => void;
  onSelectTab?: (tab: 'summarizer' | 'quiz' | 'evaluator' | 'chat' | 'progress' | 'notes-library') => void;
}

export const NotesSummarizer: React.FC<NotesSummarizerProps> = ({
  onGoToQuiz,
  onSaveToHistory,
  initialTopicData,
  onSummaryGenerated,
  onSelectTab,
}) => {
  const [inputText, setInputText] = useState(initialTopicData?.text || '');
  const [subject, setSubject] = useState(initialTopicData?.subject || 'Science / General');
  const [classLevel, setClassLevel] = useState('Class 10 (CBSE / State)');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<{ base64: string; mimeType: string; name: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<NotesSummaryResult | null>(null);

  // Active view tab for the 3 summary formats
  const [activeFormatTab, setActiveFormatTab] = useState<'short' | 'detailed' | 'examQA'>('short');
  // Telugu language toggle
  const [showTelugu, setShowTelugu] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingItemKey, setSpeakingItemKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = SpeechHelper.subscribe((status, textId) => {
      setIsSpeaking(status === 'speaking');
      if (status === 'idle') {
        setSpeakingItemKey(null);
      }
    });
    return unsub;
  }, []);

  // Update input text if initialTopicData changes
  React.useEffect(() => {
    if (initialTopicData?.text) {
      setInputText(initialTopicData.text);
      if (initialTopicData.subject) setSubject(initialTopicData.subject);
    }
  }, [initialTopicData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        setSelectedImage({
          base64: reader.result as string,
          mimeType: file.type,
          name: file.name,
        });
        setSelectedPdf(null);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      reader.onload = () => {
        setSelectedPdf({
          base64: reader.result as string,
          mimeType: 'application/pdf',
          name: file.name,
        });
        setSelectedImage(null);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.onload = () => {
        setInputText(reader.result as string);
        setSelectedImage(null);
        setSelectedPdf(null);
      };
      reader.readAsText(file);
    } else {
      setError('Please upload an image (PNG, JPG, JPEG) or a PDF document.');
    }
  };

  const handleSummarize = async () => {
    if (!inputText.trim() && !selectedImage && !selectedPdf) {
      setError('Please enter notes text or upload an image/PDF file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    SpeechHelper.stop();
    setIsSpeaking(false);
    setIsSaved(false);

    try {
      const result = await summarizeNotes({
        text: inputText.trim(),
        imageBase64: selectedImage?.base64,
        imageMimeType: selectedImage?.mimeType,
        pdfBase64: selectedPdf?.base64,
        pdfMimeType: selectedPdf?.mimeType,
        subject,
        classLevel,
      });

      setSummaryResult(result);
      ProgressTracker.recordNoteSummary();
      if (onSummaryGenerated) {
        onSummaryGenerated(result);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process and summarize notes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSpeak = () => {
    if (isSpeaking && speakingItemKey === 'notes-summary') {
      SpeechHelper.stop();
      setIsSpeaking(false);
      setSpeakingItemKey(null);
    } else if (summaryResult) {
      let textToRead = '';
      if (activeFormatTab === 'short') {
        textToRead = `Here is the 5-point summary of ${summaryResult.title}. ` + summaryResult.shortSummary.join('. ');
      } else if (activeFormatTab === 'detailed') {
        textToRead = `Detailed summary of ${summaryResult.title}. ` + summaryResult.detailedSummary;
      } else {
        textToRead = `Exam ready questions and answers for ${summaryResult.title}. ` + summaryResult.examReadyQA.map((qa, i) => `Question ${i + 1}: ${qa.question}. Answer: ${qa.modelAnswer}`).join('. ');
      }

      setSpeakingItemKey('notes-summary');
      setIsSpeaking(true);
      SpeechHelper.speak(textToRead, {
        textId: 'notes-summary',
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

  const handleSpeakTelugu = () => {
    if (!summaryResult?.teluguExplanation) return;
    if (isSpeaking && speakingItemKey === 'notes-telugu') {
      SpeechHelper.stop();
      setIsSpeaking(false);
      setSpeakingItemKey(null);
    } else {
      setSpeakingItemKey('notes-telugu');
      setIsSpeaking(true);
      SpeechHelper.speak(summaryResult.teluguExplanation, {
        textId: 'notes-telugu',
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

  const handleCopy = () => {
    if (!summaryResult) return;
    let content = `# ${summaryResult.title}\n\n`;
    content += `## 5-Point Short Summary\n` + summaryResult.shortSummary.map((s, i) => `${i + 1}. ${s}`).join('\n') + '\n\n';
    content += `## Detailed Summary\n${summaryResult.detailedSummary}\n\n`;
    content += `## Exam Ready Q&A\n` + summaryResult.examReadyQA.map((qa) => `**Q: ${qa.question} (${qa.marks}M)**\nA: ${qa.modelAnswer}\n*Tip: ${qa.scoringTip || ''}*\n`).join('\n') + '\n\n';
    if (summaryResult.teluguExplanation) {
      content += `## తెలుగు వివరణ (Telugu Explanation)\n${summaryResult.teluguExplanation}\n\n`;
    }
    content += `## Senior Tip to Score More\n${summaryResult.tipToScoreMore}\n`;

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!summaryResult) return;
    onSaveToHistory('summary', summaryResult.title, summaryResult.subject || subject, summaryResult);
    setIsSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* Input Section Card */}
      <div className="bg-[#121215] rounded-3xl p-6 sm:p-7 border border-zinc-800/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-zinc-100 font-heading">
                Notes Summarizer 📄
              </h2>
              <p className="text-xs text-zinc-400">
                Upload handwritten notes, textbook photos, PDFs or paste chapter text
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              id="select-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="Physics / Science">Physics / Science ⚡</option>
              <option value="Chemistry">Chemistry 🧪</option>
              <option value="Biology / Life Science">Biology 🧬</option>
              <option value="Mathematics">Mathematics 📐</option>
              <option value="Social Science / History">History / Social 🇮🇳</option>
              <option value="English / Literature">English 📖</option>
              <option value="Computer Science / IT">Computer Science 💻</option>
              <option value="Commerce / Economics">Commerce / Economics 📊</option>
            </select>

            <select
              id="select-class-level"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="Class 10 (CBSE/State)">Class 10 (CBSE/SSC)</option>
              <option value="Class 12 / Intermediate">Class 12 / Inter</option>
              <option value="JEE / NEET Foundation">JEE / NEET Prep</option>
              <option value="Class 8-9 Middle School">Class 8-9</option>
              <option value="College / B.Tech / Degree">College / B.Tech</option>
            </select>
          </div>
        </div>

        {/* Input Controls */}
        <div className="mt-5 space-y-4">
          {/* File Upload Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              id="dropzone-notes-upload"
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                selectedImage || selectedPdf
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : 'border-zinc-700/80 hover:border-amber-500/50 bg-zinc-900/60 hover:bg-zinc-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="notes-file-input"
              />

              {selectedImage ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Image Attached: {selectedImage.name}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Click to change file</p>
                </div>
              ) : selectedPdf ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>PDF Attached: {selectedPdf.name}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Click to change file</p>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">
                      Upload PDF or Image of Notes
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Handwritten pages, notebook snapshots, textbook scans
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Direct Textarea */}
            <div className="flex flex-col">
              <label htmlFor="notes-textarea" className="text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Or Paste Notes Text:</span>
                {inputText && (
                  <span className="text-[11px] text-zinc-500 font-normal">
                    {inputText.length} chars
                  </span>
                )}
              </label>
              <textarea
                id="notes-textarea"
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste chapter notes, lecture transcript, syllabus pointers, or copy from your textbook here..."
                className="w-full flex-1 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-sm placeholder:text-zinc-500 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none font-sans"
              />
            </div>
          </div>

          {/* Action Button & Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Generates 3 Formats (5-Pts, Paragraph, Q&A) + Formulas + Telugu</span>
            </div>

            <button
              id="btn-process-summarize"
              onClick={handleSummarize}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-md shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting & Summarizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Summarize Notes ✨</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {summaryResult && (
        <div id="summarizer-results" className="space-y-6">
          {/* Main Title & Action Bar */}
          <div className="bg-[#121215] rounded-3xl p-6 border border-zinc-800/90 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {summaryResult.subject || subject}
                  </span>
                  <span className="text-xs text-zinc-600">•</span>
                  <span className="text-xs text-zinc-400">{classLevel}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-100 font-heading mt-1">
                  {summaryResult.title}
                </h3>
              </div>

              {/* Utility buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-export-pdf-summary"
                  onClick={() => summaryResult && exportSummaryToPDF(summaryResult)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-200 transition-colors cursor-pointer"
                  title="Export summary sheet as clean PDF document"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download PDF</span>
                </button>

                <a
                  href="#section-concept-graph"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 hover:text-indigo-200 transition-colors cursor-pointer"
                  title="Jump to Interactive D3 Force-Directed Concept Graph"
                >
                  <Network className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Graph 🕸️</span>
                </a>

                <a
                  href="#section-study-roadmap"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-200 transition-colors cursor-pointer"
                  title="Jump to Interactive Study Roadmap & Learning Milestones"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Roadmap 🗺️</span>
                </a>

                <a
                  href="#section-recommended-resources"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 hover:text-blue-200 transition-colors cursor-pointer"
                  title="Jump to Google Search grounded textbooks, videos & practice PDFs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Resources 🌐</span>
                </a>

                <button
                  id="btn-audio-listen"
                  onClick={handleToggleSpeak}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isSpeaking
                      ? 'bg-rose-950/40 text-rose-300 border-rose-700 animate-pulse'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                  title="Listen to summary out loud"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Listen 🔊'}</span>
                </button>

                <button
                  id="btn-copy-summary"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  id="btn-save-summary"
                  onClick={handleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Saved! ✨' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* 80/20 Rule Banner */}
            {summaryResult.paretoEightyTwentyRule && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/40 text-zinc-100 flex items-start gap-3 text-xs sm:text-sm shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-400 text-zinc-950 flex items-center justify-center font-black text-sm flex-shrink-0 shadow-xs">
                  80/20
                </div>
                <div className="space-y-0.5">
                  <span className="font-extrabold text-amber-300 block">
                    🎯 80/20 Pareto Rule (Focus on these 20% topics to score 80% marks):
                  </span>
                  <p className="text-zinc-200 leading-relaxed font-medium">
                    {summaryResult.paretoEightyTwentyRule}
                  </p>
                </div>
              </div>
            )}

            {/* Senior Advice Banner */}
            <div className="mt-3.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-2.5 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Senior Buddy Note: </span>
                <span>{summaryResult.seniorAdvice}</span>
              </div>
            </div>

            {/* 3 Formats Selector Tabs */}
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-2 p-1 bg-zinc-900 rounded-2xl max-w-fit mb-5 border border-zinc-800">
                <button
                  id="tab-format-short"
                  onClick={() => setActiveFormatTab('short')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFormatTab === 'short'
                      ? 'bg-zinc-800 text-amber-400 shadow-xs border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>1. Short (5 Points)</span>
                </button>

                <button
                  id="tab-format-detailed"
                  onClick={() => setActiveFormatTab('detailed')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFormatTab === 'detailed'
                      ? 'bg-zinc-800 text-amber-400 shadow-xs border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>2. Detailed Summary</span>
                </button>

                <button
                  id="tab-format-examQA"
                  onClick={() => setActiveFormatTab('examQA')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFormatTab === 'examQA'
                      ? 'bg-zinc-800 text-amber-400 shadow-xs border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>3. Exam Ready (Q&A)</span>
                </button>
              </div>

              {/* Format 1: Short (5 Points) */}
              {activeFormatTab === 'short' && (
                <div id="format-short-summary" className="space-y-3">
                  <div className="grid grid-cols-1 gap-2.5">
                    {summaryResult.shortSummary.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Format 2: Detailed (Paragraph) */}
              {activeFormatTab === 'detailed' && (
                <div id="format-detailed-summary" className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <p className="text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-line font-normal">
                    {summaryResult.detailedSummary}
                  </p>
                </div>
              )}

              {/* Format 3: Exam Ready (Q&A) */}
              {activeFormatTab === 'examQA' && (
                <div id="format-exam-qa" className="space-y-3.5">
                  {summaryResult.examReadyQA.map((qa, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-extrabold">
                            Q{index + 1}
                          </span>
                          <span>{qa.question}</span>
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-bold whitespace-nowrap">
                          {qa.marks} Marks
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0D0D10] border border-zinc-800 text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
                        <strong className="text-indigo-400 font-bold block mb-1">Model Answer:</strong>
                        {qa.modelAnswer}
                      </div>

                      {qa.scoringTip && (
                        <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span><strong>Examiner Scoring Tip:</strong> {qa.scoringTip}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* High-Yield Highlights Grid: Definitions, Formulas, Key Dates, Important Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Important Definitions */}
            <div className="bg-[#121215] rounded-3xl p-5 border border-zinc-800/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
                    🏷️
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100 font-heading">
                    Definitions
                  </h4>
                </div>

                {summaryResult.definitions.length > 0 ? (
                  <div className="space-y-2.5">
                    {summaryResult.definitions.map((def, i) => (
                      <div key={i} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
                        <span className="font-extrabold text-indigo-300 block mb-0.5">
                          {def.term}
                        </span>
                        <p className="text-zinc-300">{def.definition}</p>
                        {def.teluguMeaning && (
                          <p className="text-indigo-300 font-telugu text-[11px] mt-1 pt-1 border-t border-zinc-800">
                            తెలుగు: {def.teluguMeaning}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No specific terminology defined.</p>
                )}
              </div>
            </div>

            {/* 2. Formulas & Equations */}
            <div className="bg-[#121215] rounded-3xl p-5 border border-zinc-800/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                    🧮
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100 font-heading">
                    Formulas
                  </h4>
                </div>

                {summaryResult.formulas.length > 0 ? (
                  <div className="space-y-2.5">
                    {summaryResult.formulas.map((form, i) => (
                      <div key={i} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
                        <span className="font-bold text-zinc-200 block mb-1">
                          {form.name}
                        </span>
                        <div className="p-2 rounded-lg bg-[#0D0D10] border border-amber-500/30 font-mono text-amber-300 text-xs font-semibold mb-1 text-center">
                          {form.formula}
                        </div>
                        <p className="text-zinc-400 text-[11px]">{form.explanation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No mathematical formulas.</p>
                )}
              </div>
            </div>

            {/* 3. Important Dates & Timeline */}
            <div className="bg-[#121215] rounded-3xl p-5 border border-zinc-800/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                    📅
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100 font-heading">
                    Key Dates
                  </h4>
                </div>

                {summaryResult.keyDates.length > 0 ? (
                  <div className="space-y-2.5">
                    {summaryResult.keyDates.map((d, i) => (
                      <div key={i} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-extrabold text-emerald-400">
                            {d.dateOrPeriod}
                          </span>
                        </div>
                        <p className="font-semibold text-zinc-200 mb-0.5">{d.event}</p>
                        <p className="text-zinc-400 text-[11px]">{d.significance}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No historical dates required.</p>
                )}
              </div>
            </div>

            {/* 4. Important Names */}
            <div className="bg-[#121215] rounded-3xl p-5 border border-zinc-800/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-xs">
                    👤
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100 font-heading">
                    Important Names
                  </h4>
                </div>

                {summaryResult.importantNames && summaryResult.importantNames.length > 0 ? (
                  <div className="space-y-2.5">
                    {summaryResult.importantNames.map((person, i) => (
                      <div key={i} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
                        <span className="font-extrabold text-purple-300 block mb-0.5">
                          {person.name}
                        </span>
                        <p className="font-semibold text-zinc-200 text-[11px]">{person.roleOrDiscovery}</p>
                        <p className="text-zinc-400 text-[10px] mt-0.5">{person.significance}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No specific names noted.</p>
                )}
              </div>
            </div>
          </div>

          {/* Bilingual Telugu Explanation Section */}
          {summaryResult.teluguExplanation && (
            <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-900/90 to-purple-950/30 rounded-3xl p-6 border border-indigo-500/30 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-base font-extrabold text-indigo-200 font-telugu">
                    తెలుగు వివరణ (Telugu Simple Explanation)
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSpeakTelugu}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-900 text-indigo-300 border border-indigo-500/40 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>వినండి 🔊</span>
                  </button>
                  <button
                    onClick={() => setShowTelugu(!showTelugu)}
                    className="text-xs font-semibold text-indigo-400 underline cursor-pointer"
                  >
                    {showTelugu ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {showTelugu && (
                <p className="text-sm text-zinc-200 leading-relaxed font-telugu font-normal whitespace-pre-line bg-[#0D0D10]/80 p-4 rounded-2xl border border-indigo-500/20">
                  {summaryResult.teluguExplanation}
                </p>
              )}
            </div>
          )}

          {/* Pro Tip to Score More */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-zinc-100 text-xs sm:text-sm flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-base flex-shrink-0">
              💡
            </div>
            <div>
              <span className="font-extrabold text-amber-300 block">Tip to Score More in Exams:</span>
              <p className="text-zinc-300 mt-0.5">{summaryResult.tipToScoreMore}</p>
            </div>
          </div>

          {/* Motivational Line from Senior Mentor */}
          {summaryResult.motivationalLine && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-center gap-3">
              <span className="text-xl">🌟</span>
              <div>
                <span className="font-extrabold text-amber-300 block">Senior Mentor Encouragement:</span>
                <p className="text-zinc-200 italic font-medium mt-0.5">"{summaryResult.motivationalLine}"</p>
              </div>
            </div>
          )}

          {/* D3 Force-Directed Concept Knowledge Graph */}
          <ConceptGraphVisualizer
            summary={summaryResult}
            onGoToQuiz={onGoToQuiz}
          />

          {/* Interactive Study Roadmap */}
          <StudyRoadmapView
            subject={summaryResult.subject || subject}
            topic={summaryResult.title || subject}
            classLevel={classLevel}
            notesContext={summaryResult.detailedSummary || inputText}
            onGoToQuiz={onGoToQuiz}
          />

          {/* Recommended Resources (Google Search Grounded) */}
          <RecommendedResources
            subject={summaryResult.subject || subject}
            topic={summaryResult.title || subject}
            classLevel={classLevel}
            onGoToQuiz={onGoToQuiz}
          />

          {/* What next? Interactive CTA Box */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-zinc-900 to-amber-950/40 border border-amber-500/30 text-white shadow-lg space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-zinc-950">
                <Zap className="w-3.5 h-3.5" />
                <span>EduSpark AI Next Step</span>
              </div>
              <h4 className="text-lg sm:text-xl font-extrabold font-heading text-zinc-100">
                What next? Want a quiz, summary for another chapter, or study plan? 👇
              </h4>
              <p className="text-xs text-zinc-400">
                Pick your next study superpower to keep your momentum going!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-next-quiz"
                onClick={() => onGoToQuiz(summaryResult.detailedSummary || inputText, summaryResult.title)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-zinc-950 bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-400/20 active:scale-98 transition-all cursor-pointer"
              >
                <span>1. Generate Quiz ❓</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-next-another-chapter"
                onClick={() => {
                  setInputText('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all cursor-pointer"
              >
                <span>2. Summarize Another Chapter 📄</span>
              </button>

              <button
                id="btn-next-plan-study"
                onClick={() => {
                  onSelectTab?.('chat');
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 transition-all cursor-pointer"
              >
                <span>3. Plan My Study 🗓️</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
