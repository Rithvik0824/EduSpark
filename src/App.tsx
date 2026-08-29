import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SuperpowerTab,
  NotesSummaryResult,
  QuizData,
  AssignmentEvaluationResult,
  SavedItem,
  UserSettings,
} from './types';
import { Header } from './components/Header';
import { WelcomeHero } from './components/WelcomeHero';
import { NotesSummarizer } from './components/NotesSummarizer';
import { QuizGenerator } from './components/QuizGenerator';
import { AssignmentEvaluator } from './components/AssignmentEvaluator';
import { EduSparkChat } from './components/EduSparkChat';
import { MyProgress } from './components/MyProgress';
import { SampleNotesModal } from './components/SampleNotesModal';
import { StudyHistoryModal } from './components/StudyHistoryModal';
import { PdfExportModal } from './components/PdfExportModal';
import { SettingsModal } from './components/SettingsModal';
import { ReadAloudFloatingPlayer } from './components/ReadAloudFloatingPlayer';
import { SAMPLE_TOPICS, SampleTopic } from './data/sampleCurriculum';
import { SpeechHelper } from './utils/speech';
import { loadStoredUserSettings, saveUserSettings, applyThemeToDOM } from './utils/theme';
import { ProgressTracker } from './utils/progressTracker';

export default function App() {
  const [activeTab, setActiveTab] = useState<SuperpowerTab>('summarizer');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [studyStreak, setStudyStreak] = useState<number>(() => ProgressTracker.getStreakDays());

  // User Settings & Accent Theme & Color Mode
  const [userSettings, setUserSettings] = useState<UserSettings>(() => loadStoredUserSettings());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    applyThemeToDOM(userSettings);
    SpeechHelper.setSettings({
      rate: userSettings.speechRate,
      pitch: userSettings.speechPitch,
      lang: userSettings.defaultSpeechLang,
    });
  }, [userSettings]);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    saveUserSettings(newSettings);
  };

  const handleToggleColorMode = () => {
    const nextMode = userSettings.colorMode === 'light' ? 'dark' : 'light';
    const updated: UserSettings = { ...userSettings, colorMode: nextMode };
    setUserSettings(updated);
    saveUserSettings(updated);
  };

  // Active generated data for PDF export & quick actions
  const [currentSummary, setCurrentSummary] = useState<NotesSummaryResult | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizData | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<AssignmentEvaluationResult | null>(null);

  useEffect(() => {
    setStudyStreak(ProgressTracker.getStreakDays());
  }, [activeTab, currentSummary, currentQuiz, currentEvaluation]);

  // Shared state for seamless transfers between superpowers
  const [summarizerTopicData, setSummarizerTopicData] = useState<{
    text: string;
    subject?: string;
    title?: string;
  } | undefined>(undefined);

  const [quizTopicInput, setQuizTopicInput] = useState<string>('');
  const [quizSubjectInput, setQuizSubjectInput] = useState<string>('');

  const [evaluatorQuestionPaper, setEvaluatorQuestionPaper] = useState<string>('');
  const [evaluatorAnswerSheet, setEvaluatorAnswerSheet] = useState<string>('');
  const [evaluatorSubject, setEvaluatorSubject] = useState<string>('');

  // Modals
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Local Storage for Saved Items
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem('eduspark_saved_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eduspark_saved_items', JSON.stringify(savedItems));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [savedItems]);

  // Keyboard shortcut: Escape to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  // Stop audio speech when switching tabs
  const handleTabChange = (tab: SuperpowerTab) => {
    SpeechHelper.stop();
    setActiveTab(tab);
  };

  // Handler for Summarizer -> "Want Quiz on this? Click Quiz Generator"
  const handleSummarizerToQuiz = (topicOrNotes: string, subjectName?: string) => {
    SpeechHelper.stop();
    setQuizTopicInput(topicOrNotes);
    if (subjectName) setQuizSubjectInput(subjectName);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for Quiz -> "View Notes Summary for this Topic"
  const handleQuizToSummarizer = (topicText: string) => {
    SpeechHelper.stop();
    setSummarizerTopicData({
      text: topicText,
      subject: quizSubjectInput || 'General Science',
    });
    setActiveTab('summarizer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save to history helper
  const handleSaveToHistory = (
    type: 'summary' | 'quiz' | 'evaluation',
    title: string,
    subject: string,
    data: NotesSummaryResult | QuizData | AssignmentEvaluationResult
  ) => {
    const newItem: SavedItem = {
      id: 'saved-' + Date.now(),
      type,
      title: title || 'Untitled Study Note',
      subject: subject || 'General',
      date: new Date().toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      data,
    };
    setSavedItems((prev) => [newItem, ...prev]);
  };

  const handleDeleteSavedItem = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setSavedItems([]);
  };

  const handleLoadSavedItem = (item: SavedItem) => {
    SpeechHelper.stop();
    if (item.type === 'summary') {
      const summaryData = item.data as NotesSummaryResult;
      setSummarizerTopicData({
        text: summaryData.extractedRawText || summaryData.detailedSummary || '',
        subject: summaryData.subject || item.subject,
        title: summaryData.title,
      });
      setActiveTab('summarizer');
    } else if (item.type === 'quiz') {
      const qData = item.data as QuizData;
      setQuizTopicInput(qData.title || '');
      setQuizSubjectInput(qData.subject || item.subject);
      setActiveTab('quiz');
    } else if (item.type === 'evaluation') {
      const evData = item.data as AssignmentEvaluationResult;
      setEvaluatorSubject(evData.subject || item.subject);
      setActiveTab('evaluator');
    }
  };

  // Select sample curriculum topic
  const handleSelectSampleTopic = (topic: SampleTopic, targetSuperpower: SuperpowerTab) => {
    SpeechHelper.stop();
    if (targetSuperpower === 'summarizer') {
      setSummarizerTopicData({
        text: topic.notesText,
        subject: topic.subject,
        title: topic.title,
      });
      setActiveTab('summarizer');
    } else if (targetSuperpower === 'quiz') {
      setQuizTopicInput(topic.notesText);
      setQuizSubjectInput(topic.subject);
      setActiveTab('quiz');
    } else if (targetSuperpower === 'evaluator') {
      setEvaluatorQuestionPaper(topic.sampleQuestionPaper || '');
      setEvaluatorAnswerSheet(topic.sampleStudentAnswerSheet || '');
      setEvaluatorSubject(topic.subject);
      setActiveTab('evaluator');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans selection:bg-[var(--theme-accent-subtle)] selection:text-[var(--theme-accent-300)]">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenSamples={() => setIsSampleModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        historyCount={savedItems.length}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
        onOpenPdfExport={() => setIsPdfModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        accentColor={userSettings.accentColor}
        colorMode={userSettings.colorMode}
        onToggleColorMode={handleToggleColorMode}
        streakDays={studyStreak}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Senior Hero (hidden in Focus Mode and Chat) */}
        {!isFocusMode && activeTab !== 'chat' && (
          <WelcomeHero
            onSelectTab={handleTabChange}
            onSelectSampleTopic={(topicId) => {
              const topic = SAMPLE_TOPICS.find((t) => t.id === topicId);
              if (topic) handleSelectSampleTopic(topic, activeTab);
            }}
          />
        )}

        {/* Superpowers with smooth Framer Motion page transitions */}
        <AnimatePresence mode="wait">
          {activeTab === 'summarizer' && (
            <motion.div
              key="summarizer"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <NotesSummarizer
                onGoToQuiz={handleSummarizerToQuiz}
                onSaveToHistory={handleSaveToHistory}
                initialTopicData={summarizerTopicData}
                onSummaryGenerated={setCurrentSummary}
                onSelectTab={handleTabChange}
              />
            </motion.div>
          )}

          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <QuizGenerator
                initialTopic={quizTopicInput}
                initialSubject={quizSubjectInput}
                onSaveToHistory={handleSaveToHistory}
                onSwitchToSummarizer={handleQuizToSummarizer}
                onQuizGenerated={setCurrentQuiz}
              />
            </motion.div>
          )}

          {activeTab === 'evaluator' && (
            <motion.div
              key="evaluator"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <AssignmentEvaluator
                onSaveToHistory={handleSaveToHistory}
                initialQuestionPaper={evaluatorQuestionPaper}
                initialAnswerSheet={evaluatorAnswerSheet}
                initialSubject={evaluatorSubject}
                onEvaluationGenerated={setCurrentEvaluation}
              />
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <EduSparkChat onSelectSuperpower={handleTabChange} />
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <MyProgress
                accentColor={userSettings.accentColor}
                onNavigateTab={handleTabChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <footer className="mt-auto border-t border-zinc-800/80 bg-[#0C0C0E] py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-zinc-100 text-sm tracking-tight">
                EduSpark<span className="theme-accent-text">.AI</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Intelligent Education Assistant for Indian Students 🇮🇳✨</span>
            </div>

            <div className="flex items-center gap-4 text-zinc-400 font-medium">
              <button
                onClick={() => handleTabChange('summarizer')}
                className="hover:theme-accent-text transition-colors cursor-pointer"
              >
                1. Notes Summarizer
              </button>
              <button
                onClick={() => handleTabChange('quiz')}
                className="hover:text-indigo-400 transition-colors cursor-pointer"
              >
                2. Quiz Generator
              </button>
              <button
                onClick={() => handleTabChange('evaluator')}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                3. Assignment Evaluator
              </button>
              <button
                onClick={() => handleTabChange('progress')}
                className="hover:theme-accent-text transition-colors cursor-pointer"
              >
                4. My Progress
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Floating Read Aloud Audio Player Controller */}
      <ReadAloudFloatingPlayer />

      {/* PDF Exporter Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        activeTab={activeTab}
        currentSummary={currentSummary}
        currentQuiz={currentQuiz}
        currentEvaluation={currentEvaluation}
      />

      {/* User Preferences & Theme Customizer Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={userSettings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Sample Topics Selection Modal */}
      <SampleNotesModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectTopic={handleSelectSampleTopic}
      />

      {/* Study History Modal */}
      <StudyHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        savedItems={savedItems}
        onDeleteItem={handleDeleteSavedItem}
        onClearAll={handleClearAllHistory}
        onLoadItem={handleLoadSavedItem}
      />
    </div>
  );
}
