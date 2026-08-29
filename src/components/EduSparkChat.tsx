import React, { useState, useRef, useEffect } from 'react';
import { StructuredChatMessage, SuperpowerTab } from '../types';
import { sendChatMessage } from '../services/api';
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  FileText,
  HelpCircle,
  CheckSquare,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Award,
  BookOpen,
  Languages,
  User,
  Bot,
  Trash2,
  Calendar,
  Clock,
  Zap,
  Check,
  Copy,
} from 'lucide-react';

interface EduSparkChatProps {
  onSelectSuperpower: (tab: SuperpowerTab) => void;
}

export const EduSparkChat: React.FC<EduSparkChatProps> = ({ onSelectSuperpower }) => {
  const [messages, setMessages] = useState<StructuredChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      timestamp: Date.now(),
      text: `Welcome to EduSpark AI 📚✨\nYour Personal 3-in-1 Study Buddy!\n\n👇 Select an option to start:\n1. 📄 Summarize My Notes\n2. ❓ Generate Quiz\n3. 📝 Evaluate Assignment\n4. 🗓️ Plan My Study\n\nJust upload your PDF/Image or ask your doubt!`,
      structured: {
        summary: "EduSpark AI 📚 - India's First 3-in-1 AI Study Buddy made by students, for students. Reduce your 3-hour study effort to just 30 seconds!",
        keyPoints: [
          "1. 📄 Summarize My Notes: 5 crisp points, 1 detailed paragraph, 3 exam Q&A, key definitions & 80/20 Rule.",
          "2. ❓ Generate Quiz: 5 MCQs, 2 Short Answers, 1 Long Answer with instant grading.",
          "3. 📝 Evaluate Assignment: Step-by-step scoring (marks out of 10), strengths, and tips to score full marks.",
          "4. 🗓️ Plan My Study: Type 'plan my study' for day-wise timetable with Easy to Hard chapters.",
          "5. 💬 Doubt Solver: Type 'doubt' for 3-step explanation in Telugu+English with real-life analogies!",
        ],
        quiz: [
          {
            question: "Which superpower do you want to explore first?",
            options: ["1. 📄 Summarize My Notes", "2. ❓ Generate Quiz", "3. 📝 Evaluate Assignment", "4. 🗓️ Plan My Study"],
            correctAnswer: "All of the above! 🚀",
            explanation: "Click any option or type your question/doubt below!",
          },
        ],
        evaluation: "Regular revision and practicing previous year questions (PYQs) with active recall ensures 95%+ in board exams!",
        tipToScoreMore: "Highlight keywords and write final numeric values in neat rectangular boxes for maximum examiner marks! 💡",
        motivationalLine: "Every expert was once a beginner. Keep learning and shining bright! 🌟",
        nextStepPrompt: "What next? Want a quiz, summary for another chapter, or study plan? 👇",
        teluguExplanation: "నమస్కారం! మీ ఎడ్యుకేషన్ ఫ్రెండ్ EduSpark AI రెడీగా ఉంది. 'plan my study' అని అడిగితే టైమ్‌టేబుల్ ఇస్తాను, లేదా మీ 'doubt' అడిగితే తెలుగు+ఇంగ్లీష్ మిక్స్‌లో నిజ జీవిత ఉదాహరణలతో సులభంగా వివరిస్తాను! ✨",
      },
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedTimetableId, setCopiedTimetableId] = useState<string | null>(null);
  // Interactive mini quiz states for chat
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = 'user-' + Date.now();
    const newUserMsg: StructuredChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const historyContext = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text || m.structured?.summary || '',
      }));

      const res = await sendChatMessage({
        message: textToSend.trim(),
        history: historyContext,
      });

      const assistantMsg: StructuredChatMessage = {
        id: 'assistant-' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        text: res.text,
        structured: res.structured,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: StructuredChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        text: "Oops, looks like I hit a quick snag! Let's try again in a moment bro 📚✨.",
        structured: {
          summary: "Could not complete the query due to a temporary network hitch.",
          keyPoints: ["Please check your connection and retry."],
          quiz: [],
          evaluation: "Retry your request or pick one of the 3 Superpowers above.",
          tipToScoreMore: "Never give up when encountering a difficult problem! 💪",
        },
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTimetable = (msgId: string, slots?: any[]) => {
    if (!slots || slots.length === 0) return;
    const formatted = slots
      .map((s, i) => `Slot ${i + 1} (${s.timeSlot}): ${s.activity} | Focus: ${s.focusArea} | Method: ${s.studyMethod}`)
      .join('\n');
    navigator.clipboard.writeText(`📅 My EduSpark Study Timetable:\n\n${formatted}`);
    setCopiedTimetableId(msgId);
    setTimeout(() => setCopiedTimetableId(null), 2500);
  };

  const handleClearChat = () => {
    if (confirm('Clear chat history?')) {
      setMessages([
        {
          id: 'welcome-reset',
          sender: 'assistant',
          timestamp: Date.now(),
          text: "Fresh chat started! What topic would you like to master today? Try typing 'plan my study' or ask any 'doubt' in Telugu+English! 📚✨",
          structured: {
            summary: "Ready to help you top your exams!",
            keyPoints: [
              "Type 'plan my study' to get a customized timetable.",
              "Type 'doubt' to explain concepts in Telugu+English with real-world examples.",
            ],
            quiz: [],
            evaluation: "Let's study smart together.",
            tipToScoreMore: "Practice previous year questions (PYQs) for high returns!",
          },
        },
      ]);
      setSelectedQuizAnswers({});
    }
  };

  return (
    <div className="bg-[#121215] rounded-3xl border border-zinc-800/90 shadow-sm overflow-hidden flex flex-col h-[750px] max-h-[85vh]">
      {/* Chat Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-[#121215] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 text-zinc-950 flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-zinc-100 text-base">
                Senior AI Buddy & Doubt Solver
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Always Structured 📚
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Encouraging mentor • 📅 Timetable Planner • 💡 Telugu+English Doubt Solver • ❓ Quizzes
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Bar including Bonus Triggers */}
      <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          Quick Actions:
        </span>
        <button
          onClick={() => handleSend('plan my study')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          Plan My Study ⏰
        </button>
        <button
          onClick={() => handleSend('I have a doubt in Newton’s laws of motion. Please explain with a Telugu+English example.')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
          Solve Doubt (Telugu+Eng) 💡
        </button>
        <button
          onClick={() => onSelectSuperpower('summarizer')}
          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-200 border border-zinc-700/80 hover:bg-zinc-800 hover:text-zinc-100 transition-all shadow-xs cursor-pointer"
        >
          📄 Summarize Notes
        </button>
        <button
          onClick={() => onSelectSuperpower('quiz')}
          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-200 border border-zinc-700/80 hover:bg-zinc-800 hover:text-zinc-100 transition-all shadow-xs cursor-pointer"
        >
          ❓ Generate Quiz
        </button>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#0D0D10]">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-400 text-zinc-950 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl space-y-3 ${isAssistant ? 'w-full' : ''}`}>
                {/* Plain conversational bubble or Intro */}
                {msg.text && (
                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-xs'
                        : 'bg-amber-500 text-zinc-950 font-semibold ml-auto max-w-fit shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}

                {/* Structured Assistant Response Card (Mandatory 5 Sections + Bonus Timetable / Doubts) */}
                {isAssistant && msg.structured && (
                  <div className="bg-[#121215] rounded-3xl p-5 border border-zinc-800/90 shadow-sm space-y-4">
                    
                    {/* BONUS 1: Visual Study Timetable (Rendered when 'plan my study' is triggered) */}
                    {msg.structured.timetable && msg.structured.timetable.length > 0 && (
                      <div className="space-y-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                              📅 High-Scoring Study Timetable (స్టడీ టైమ్‌టేబుల్)
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyTimetable(msg.id, msg.structured?.timetable)}
                            className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                          >
                            {copiedTimetableId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy Schedule
                              </>
                            )}
                          </button>
                        </div>

                        <div className="space-y-2">
                          {msg.structured.timetable.map((slot, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30 whitespace-nowrap">
                                  {slot.timeSlot}
                                </span>
                                <div>
                                  <span className="font-bold text-zinc-100 block">{slot.activity}</span>
                                  <span className="text-[11px] text-zinc-400">{slot.focusArea}</span>
                                </div>
                              </div>

                              <div className="sm:text-right flex-shrink-0">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-semibold">
                                  {slot.studyMethod}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BONUS 2: Dedicated Bilingual 3-Step Doubt Solver Card */}
                    {msg.structured.doubtBreakdown && (
                      <div className="space-y-3 p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                              💡 3-Step Doubt Solver (Telugu + English Mix)
                            </span>
                          </div>
                          {msg.structured.doubtBreakdown.doubtTopic && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {msg.structured.doubtBreakdown.doubtTopic}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2.5 text-xs">
                          {/* Step 1: Simple Definition */}
                          {msg.structured.doubtBreakdown.simpleDefinition && (
                            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                              <span className="font-bold text-amber-300 block mb-1">
                                1️⃣ Step 1: Simple Definition
                              </span>
                              <p className="text-zinc-200 leading-relaxed">
                                {msg.structured.doubtBreakdown.simpleDefinition}
                              </p>
                            </div>
                          )}

                          {/* Step 2: Real-Life Example & Relatable Analogy */}
                          {(msg.structured.doubtBreakdown.realLifeExample || msg.structured.doubtBreakdown.analogy) && (
                            <div className="p-3 rounded-xl bg-purple-900/20 border border-purple-500/30">
                              <span className="font-bold text-purple-300 block mb-1">
                                2️⃣ Step 2: Real-Life Example & Analogy (నిజ జీవిత ఉదాహరణ)
                              </span>
                              <p className="text-zinc-200 leading-relaxed font-telugu">
                                {msg.structured.doubtBreakdown.realLifeExample}
                              </p>
                              {msg.structured.doubtBreakdown.analogy && (
                                <p className="text-purple-200 font-medium text-[11px] mt-1.5 pt-1.5 border-t border-purple-500/20 italic">
                                  💡 Relatable Analogy: {msg.structured.doubtBreakdown.analogy}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Step 3: Perfect Exam Answer */}
                          {msg.structured.doubtBreakdown.perfectExamAnswer && (
                            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                              <span className="font-bold text-emerald-300 block mb-1">
                                3️⃣ Step 3: Perfect Exam Answer (Write this in Exam for Full Marks)
                              </span>
                              <p className="text-zinc-200 leading-relaxed font-medium">
                                {msg.structured.doubtBreakdown.perfectExamAnswer}
                              </p>
                            </div>
                          )}

                          {/* Telugu + English Concept Explanation */}
                          {msg.structured.doubtBreakdown.teluguEnglishExplanation && (
                            <div className="p-3 rounded-xl bg-zinc-900/90 border border-indigo-500/30">
                              <span className="font-bold text-indigo-300 block mb-1">
                                📖 Telugu + English Explanation (ద్విభాషా వివరణ):
                              </span>
                              <p className="text-zinc-200 leading-relaxed font-telugu">
                                {msg.structured.doubtBreakdown.teluguEnglishExplanation}
                              </p>
                            </div>
                          )}

                          {/* Key Takeaway */}
                          {msg.structured.doubtBreakdown.keyTakeaway && (
                            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-emerald-300 block text-[11px]">Key Exam Takeaway:</strong>
                                <span className="text-zinc-300 text-[11px]">{msg.structured.doubtBreakdown.keyTakeaway}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 1. 📄 Summary */}
                    {msg.structured.summary && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-100">
                          <span className="text-amber-400">📄</span>
                          <span>Summary:</span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800 font-normal">
                          {msg.structured.summary}
                        </p>
                      </div>
                    )}

                    {/* 2. ⭐ Key Points */}
                    {msg.structured.keyPoints && msg.structured.keyPoints.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-100">
                          <span className="text-amber-400">⭐</span>
                          <span>Key Points:</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.structured.keyPoints.map((point, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                              <span className="w-4 h-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. ❓ Quiz */}
                    {msg.structured.quiz && msg.structured.quiz.length > 0 && (
                      <div className="space-y-2 p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-300">
                          <span>❓</span>
                          <span>Quick Check Quiz:</span>
                        </div>

                        {msg.structured.quiz.map((q, qIdx) => {
                          const quizKey = `${msg.id}-${qIdx}`;
                          const selectedOpt = selectedQuizAnswers[quizKey];
                          const hasAnswered = selectedOpt !== undefined;

                          return (
                            <div key={qIdx} className="space-y-2 text-xs">
                              <p className="font-bold text-zinc-100">{q.question}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = selectedOpt === optIdx;
                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() =>
                                        setSelectedQuizAnswers((prev) => ({
                                          ...prev,
                                          [quizKey]: optIdx,
                                        }))
                                      }
                                      className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                                        hasAnswered && isSelected
                                          ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-xs'
                                          : 'bg-zinc-900 text-zinc-200 border-zinc-700/80 hover:bg-zinc-800'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {hasAnswered && (
                                <div className="p-2 rounded-xl bg-zinc-900 border border-indigo-500/30 text-[11px] text-zinc-300">
                                  <strong className="text-indigo-400">Answer Explanation:</strong>{' '}
                                  {q.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 4. 📝 Evaluation */}
                    {msg.structured.evaluation && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-100">
                          <span className="text-emerald-400">📝</span>
                          <span>Evaluation & Exam Importance:</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed bg-emerald-950/20 p-3 rounded-2xl border border-emerald-500/20">
                          {msg.structured.evaluation}
                        </p>
                      </div>
                    )}

                    {/* 5. 💡 Tip to Score More */}
                    {msg.structured.tipToScoreMore && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2">
                        <span className="text-base flex-shrink-0">💡</span>
                        <div>
                          <strong className="block text-amber-300">Tip to Score More:</strong>
                          <span className="text-zinc-300">{msg.structured.tipToScoreMore}</span>
                        </div>
                      </div>
                    )}

                    {/* Bilingual Telugu explanation if provided */}
                    {msg.structured.teluguExplanation && !msg.structured.doubtBreakdown && (
                      <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs text-zinc-300 font-telugu">
                        <strong className="text-purple-300 block mb-0.5">తెలుగు వివరణ:</strong>
                        <span>{msg.structured.teluguExplanation}</span>
                      </div>
                    )}

                    {/* Motivational Line */}
                    {msg.structured.motivationalLine && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                        <span className="text-base">🌟</span>
                        <div>
                          <strong className="text-amber-300 block text-[11px]">Senior Mentor Word of Motivation:</strong>
                          <span className="text-zinc-200 italic">"{msg.structured.motivationalLine}"</span>
                        </div>
                      </div>
                    )}

                    {/* Next Step Prompt & Quick Buttons */}
                    <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-2">
                      <p className="font-extrabold text-amber-300 flex items-center gap-1.5">
                        <span>👇</span>
                        <span>{msg.structured.nextStepPrompt || 'What next? Want a quiz, summary for another chapter, or study plan?'}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => onSelectSuperpower?.('quiz')}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-colors cursor-pointer"
                        >
                          Generate Quiz ❓
                        </button>
                        <button
                          onClick={() => onSelectSuperpower?.('summarizer')}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer"
                        >
                          Summarize Notes 📄
                        </button>
                        <button
                          onClick={() => handleSend('plan my study with day-wise timetable ordered by easy to hard')}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-colors cursor-pointer"
                        >
                          Plan Timetable 🗓️
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-400 text-zinc-950 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Senior AI Buddy is structuring your answer / timetable 📚✨...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-[#121215] border-t border-zinc-800/80 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        <span className="text-[11px] font-bold text-zinc-500 flex-shrink-0">Try asking:</span>
        <button
          onClick={() => handleSend('plan my study for board exams with daily timetable')}
          className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
        >
          📅 Plan My Study
        </button>
        <button
          onClick={() => handleSend('doubt: Explain Electric Potential Difference in Telugu+English with real life battery example')}
          className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
        >
          💡 Doubt: Potential Difference
        </button>
        <button
          onClick={() => handleSend('doubt: Why does a spinning cricket ball swing in air? Explain in Telugu+English')}
          className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:border-amber-500/40 hover:text-zinc-100 transition-colors whitespace-nowrap cursor-pointer"
        >
          🏏 Doubt: Cricket Ball Swing
        </button>
        <button
          onClick={() => handleSend('Explain Ohm’s Law with formulas and exam tips')}
          className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:border-amber-500/40 hover:text-zinc-100 transition-colors whitespace-nowrap cursor-pointer"
        >
          ⚡ Explain Ohm’s Law
        </button>
      </div>

      {/* Message Input Box */}
      <div className="p-4 bg-[#121215] border-t border-zinc-800/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="chat-input-field"
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask your doubt (e.g. 'plan my study', 'doubt in photosynthesis', 'Telugu explanation of Newton laws')..."
            className="flex-1 px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-sm text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-950 focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />

          <button
            id="btn-send-chat"
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-zinc-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

