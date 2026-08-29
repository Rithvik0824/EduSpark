import React from 'react';
import { motion } from 'motion/react';
import { SuperpowerTab } from '../types';
import { FileText, HelpCircle, CheckSquare, Sparkles, ArrowRight, Zap, Languages, Calendar, MessageSquare, TrendingUp } from 'lucide-react';

interface WelcomeHeroProps {
  onSelectTab: (tab: SuperpowerTab) => void;
  onSelectSampleTopic?: (topicId: string) => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ onSelectTab, onSelectSampleTopic }) => {
  return (
    <div className="mb-8 overflow-hidden rounded-3xl bg-zinc-900/70 border border-zinc-800/80 p-6 sm:p-8 shadow-sm">
      {/* Senior Greeting Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Welcome to EduSpark AI 📚✨</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-100 font-heading tracking-tight">
            Your Personal <span className="text-amber-400">3-in-1 Study Buddy!</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-2xl">
            India's First 3-in-1 AI Study Buddy made by students, for students. Just upload your PDF/Image or ask your doubt!
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 px-3.5 py-2 rounded-2xl border border-zinc-800 shadow-xs">
          <Languages className="w-4 h-4 text-indigo-400" />
          <div className="text-xs">
            <span className="font-bold text-zinc-200 font-telugu">తెలుగు + English</span>
            <p className="text-[10px] text-zinc-400">Bilingual Telugu support</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs font-extrabold text-zinc-300">
        <span>👇 Select an option to start:</span>
      </div>

      {/* 4 Superpower Starting Option Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* Option 1: Summarize My Notes */}
        <motion.div
          id="hero-card-summarizer"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectTab('summarizer')}
          className="group relative bg-[#121215] rounded-2xl p-4.5 border border-zinc-800/90 shadow-sm hover:shadow-md hover:border-amber-500/50 hover:bg-zinc-900/90 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Option 1
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                1. 📄 Summarize My Notes
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                5 crisp bullets, 1 detailed paragraph, 3 exam Q&A, key definitions/formulas & <strong>80/20 Rule</strong>.
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-amber-400">
            <span>Start Summary</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Option 2: Generate Quiz */}
        <motion.div
          id="hero-card-quiz"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectTab('quiz')}
          className="group relative bg-[#121215] rounded-2xl p-4.5 border border-zinc-800/90 shadow-sm hover:shadow-md hover:border-indigo-500/50 hover:bg-zinc-900/90 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                Option 2
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                2. ❓ Generate Quiz
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                5 MCQs + 2 Short Answers + 1 Long Answer with Difficulty tags and instant interactive evaluation.
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-indigo-400">
            <span>Start Quiz</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Option 3: Evaluate Assignment */}
        <motion.div
          id="hero-card-evaluator"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectTab('evaluator')}
          className="group relative bg-[#121215] rounded-2xl p-4.5 border border-zinc-800/90 shadow-sm hover:shadow-md hover:border-emerald-500/50 hover:bg-zinc-900/90 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <CheckSquare className="w-4.5 h-4.5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Option 3
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                3. 📝 Evaluate Assignment
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Supportive teacher grading: <strong>Marks X/10</strong>, ✅ Strengths, ❌ Areas to Improve & 💡 Model Answers.
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-emerald-400">
            <span>Evaluate Sheet</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Option 4: Plan My Study */}
        <motion.div
          id="hero-card-planner"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectTab('chat')}
          className="group relative bg-[#121215] rounded-2xl p-4.5 border border-zinc-800/90 shadow-sm hover:shadow-md hover:border-orange-500/50 hover:bg-zinc-900/90 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-300 border border-orange-500/30">
                Option 4
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">
                4. 🗓️ Plan My Study
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Exam in X days? Get day-wise timetable, focus sessions, breaks, and Easy-to-Hard chapter ordering.
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-orange-400">
            <span>Plan Timetable</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      </div>

      {/* Quick Launch Preset Topics */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/80">
        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Try Sample Board Topics:
        </span>
        <button
          id="quick-topic-1"
          onClick={() => onSelectSampleTopic?.('cbse-10-electricity')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-amber-500 hover:text-zinc-950 border border-zinc-700/60 transition-all cursor-pointer"
        >
          ⚡ CBSE 10th Electricity
        </button>
        <button
          id="quick-topic-2"
          onClick={() => onSelectSampleTopic?.('class-12-semiconductors')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-indigo-600 hover:text-white border border-zinc-700/60 transition-all cursor-pointer"
        >
          🔬 Class 12 Semiconductors
        </button>
        <button
          id="quick-topic-3"
          onClick={() => onSelectSampleTopic?.('history-freedom-movement')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-orange-600 hover:text-white border border-zinc-700/60 transition-all cursor-pointer"
        >
          🇮🇳 Indian Freedom Movement
        </button>
        <button
          id="quick-view-chat"
          onClick={() => onSelectTab('chat')}
          className="ml-auto px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Ask Doubt (Telugu+Eng) 💬</span>
        </button>
      </div>
    </div>
  );
};
