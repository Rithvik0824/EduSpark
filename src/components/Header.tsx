import React from 'react';
import { motion } from 'motion/react';
import { SuperpowerTab, AccentColor, ColorMode } from '../types';
import { ACCENT_THEMES } from '../utils/theme';
import {
  Sparkles,
  FileText,
  HelpCircle,
  CheckSquare,
  MessageSquare,
  BookOpen,
  History,
  Maximize2,
  Minimize2,
  FileDown,
  ChevronDown,
  Settings,
  TrendingUp,
  Sun,
  Moon,
  Flame,
} from 'lucide-react';

interface HeaderProps {
  activeTab: SuperpowerTab;
  setActiveTab: (tab: SuperpowerTab) => void;
  onOpenSamples: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenPdfExport: () => void;
  onOpenSettings: () => void;
  accentColor?: AccentColor;
  colorMode?: ColorMode;
  onToggleColorMode?: () => void;
  streakDays?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSamples,
  onOpenHistory,
  historyCount,
  isFocusMode,
  onToggleFocusMode,
  onOpenPdfExport,
  onOpenSettings,
  accentColor = 'amber',
  colorMode = 'dark',
  onToggleColorMode,
  streakDays = 1,
}) => {
  const currentTheme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.amber;

  const tabs: { id: SuperpowerTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'summarizer',
      label: 'Notes Summarizer',
      icon: <FileText className="w-4 h-4" />,
      badge: 'Superpower 1',
    },
    {
      id: 'quiz',
      label: 'Quiz Generator',
      icon: <HelpCircle className="w-4 h-4" />,
      badge: 'Superpower 2',
    },
    {
      id: 'evaluator',
      label: 'Assignment Evaluator',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: 'Superpower 3',
    },
    {
      id: 'chat',
      label: 'Senior AI Buddy',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'progress',
      label: 'My Progress',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: 'Analytics',
    },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <header className="sticky top-0 z-40 bg-[#09090B]/90 backdrop-blur-md border-b border-zinc-800/80 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div
            id="brand-logo"
            onClick={() => setActiveTab('summarizer')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${currentTheme.gradient} flex items-center justify-center text-white shadow-md ${currentTheme.cardGlow} group-hover:scale-105 transition-transform duration-200`}>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl font-extrabold tracking-tight text-zinc-100">
                  EduSpark<span className="theme-accent-text">.AI</span>
                </span>
                {isFocusMode ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold theme-accent-bg-subtle theme-accent-text border theme-accent-border-subtle animate-pulse">
                    <span>🎯 Focus Mode</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold theme-accent-bg-subtle theme-accent-text border theme-accent-border-subtle">
                    🇮🇳 Indian Students
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden md:block">
                {isFocusMode ? 'Distraction-Free Deep Study Environment' : 'Your 24x7 Friendly Senior & Exam Mentor 📚✨'}
              </p>
            </div>
          </div>

          {/* If NOT Focus Mode: Full Navigation Tabs */}
          {!isFocusMode && (
            <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 relative">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? 'text-zinc-100 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="header-active-tab"
                        className="absolute inset-0 bg-zinc-800 rounded-xl border border-zinc-700/60 shadow-sm"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className={`relative z-10 ${isActive ? 'theme-accent-text' : 'text-zinc-400'}`}>
                      {tab.icon}
                    </span>
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* If in Focus Mode: Compact Active Tool Switcher */}
          {isFocusMode && (
            <div className="flex items-center gap-2 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 pl-3 pr-1 hidden sm:inline">Active Tool:</span>
              <div className="flex items-center gap-1">
                {(['summarizer', 'quiz', 'evaluator'] as SuperpowerTab[]).map((tabId) => {
                  const t = tabs.find((x) => x.id === tabId)!;
                  const isActive = activeTab === tabId;
                  return (
                    <button
                      key={tabId}
                      onClick={() => setActiveTab(tabId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-zinc-800 theme-accent-text border border-zinc-700 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      {t.icon}
                      <span className="hidden md:inline">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-2">
            {/* Small Study Streak Indicator */}
            <button
              id="btn-header-study-streak"
              onClick={() => setActiveTab('progress')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs group"
              title={`🔥 ${streakDays}-Day Study Streak! Click to view learning habits & analytics`}
              aria-label={`Study streak: ${streakDays} consecutive days`}
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500/80 animate-pulse group-hover:scale-110 transition-transform" />
              <span className="font-extrabold tracking-tight text-amber-300">
                {streakDays}
              </span>
              <span className="hidden xl:inline text-[11px] text-amber-400/80 font-semibold">
                {streakDays === 1 ? 'day streak' : 'days streak'}
              </span>
            </button>

            {/* PDF Exporter Button */}
            <button
              id="btn-pdf-export-header"
              onClick={onOpenPdfExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-200 bg-zinc-900 hover:bg-zinc-800 hover:theme-accent-text transition-colors border border-zinc-800 cursor-pointer"
              title="Export Summary / Quiz / Evaluation to PDF"
            >
              <FileDown className="w-4 h-4 theme-accent-text" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {!isFocusMode && (
              <button
                id="btn-sample-topics"
                onClick={onOpenSamples}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-100 transition-colors border border-zinc-800 cursor-pointer"
                title="Load Indian curriculum sample topics"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Sample Topics</span>
              </button>
            )}

            <button
              id="btn-study-history"
              onClick={onOpenHistory}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-100 transition-colors border border-zinc-800 cursor-pointer"
              title="Saved summaries & quizzes"
            >
              <History className="w-4 h-4 theme-accent-text" />
              <span className="hidden sm:inline">Saved</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold theme-accent-bg text-zinc-950">
                  {historyCount}
                </span>
              )}
            </button>

            {/* User Settings & Accent Theme Button */}
            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-100 transition-colors border border-zinc-800 cursor-pointer"
              title="Preferences & Accent Color Theme"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                style={{ backgroundColor: currentTheme.previewHex }}
              />
              <Settings className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Quick Dark/Light Mode Switcher */}
            {onToggleColorMode && (
              <button
                id="btn-header-theme-toggle"
                onClick={onToggleColorMode}
                className="flex items-center justify-center w-8 h-8 rounded-xl text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:theme-accent-text transition-colors border border-zinc-800 cursor-pointer"
                title={colorMode === 'light' ? 'Switch to Sophisticated Dark mode' : 'Switch to Clean Light mode'}
                aria-label={colorMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {colorMode === 'light' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            )}

            {/* Focus Mode Toggle Button */}
            <button
              id="btn-toggle-focus-mode"
              onClick={onToggleFocusMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                isFocusMode
                  ? 'theme-accent-bg text-zinc-950 border-transparent shadow-md hover:opacity-90'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:theme-accent-text'
              }`}
              title={isFocusMode ? 'Exit Focus Mode (Esc)' : 'Enter Focus Mode (hides nav & footer)'}
            >
              {isFocusMode ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Exit Focus</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 theme-accent-text" />
                  <span className="hidden sm:inline">Focus Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Tabs (only when NOT in focus mode) */}
        {!isFocusMode && (
          <div className="flex lg:hidden overflow-x-auto py-2 gap-1.5 border-t border-zinc-800 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-mobile-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'theme-accent-bg text-zinc-950 font-bold shadow-xs'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};

