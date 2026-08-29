import React, { useState } from 'react';
import { UserSettings, AccentColor, ColorMode } from '../types';
import { ACCENT_THEMES, AccentThemeConfig, saveUserSettings, DEFAULT_USER_SETTINGS, applyThemeToDOM } from '../utils/theme';
import { SpeechHelper } from '../utils/speech';
import confetti from 'canvas-confetti';
import { fireDistinctionCelebration } from '../utils/confetti';
import {
  Settings,
  X,
  Palette,
  Volume2,
  Sliders,
  Sparkles,
  RotateCcw,
  Check,
  CheckCircle2,
  VolumeX,
  Zap,
  BookOpen,
  Moon,
  Sun,
  SunMedium,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'audio' | 'study'>('theme');
  const [currentSettings, setCurrentSettings] = useState<UserSettings>(settings);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // Synchronize with incoming settings when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSelectColorMode = (mode: ColorMode) => {
    const updated: UserSettings = { ...currentSettings, colorMode: mode };
    setCurrentSettings(updated);
    onUpdateSettings(updated);
    saveUserSettings(updated);
  };

  const handleSelectAccent = (color: AccentColor) => {
    const updated: UserSettings = { ...currentSettings, accentColor: color };
    setCurrentSettings(updated);
    onUpdateSettings(updated);
    saveUserSettings(updated);
    
    // Quick mini celebration on theme switch
    if (updated.showCelebrationConfetti) {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.6 },
        colors: [
          ACCENT_THEMES[color].previewHex,
          '#ffffff',
          '#6366f1',
        ],
      });
    }
  };

  const handleSpeechChange = (patch: Partial<UserSettings>) => {
    const updated: UserSettings = { ...currentSettings, ...patch };
    setCurrentSettings(updated);
    onUpdateSettings(updated);
    saveUserSettings(updated);

    // Also update SpeechHelper directly
    SpeechHelper.setSettings({
      rate: updated.speechRate,
      pitch: updated.speechPitch,
      lang: updated.defaultSpeechLang,
    });
  };

  const handleTestVoice = () => {
    if (isPlayingTest) {
      SpeechHelper.stop();
      setIsPlayingTest(false);
    } else {
      setIsPlayingTest(true);
      const testSentence =
        currentSettings.defaultSpeechLang === 'te-IN'
          ? 'నమస్కారం! నేను మీ ఎడ్యుస్పార్క్ సీనియర్ బడ్డీని. మీ పరీక్షల కోసం శుభాకాంక్షలు!'
          : currentSettings.defaultSpeechLang === 'hi-IN'
          ? 'नमस्ते! मैं आपका एड्युस्पार्क सीनियर बड्डी हूँ। आपकी पढ़ाई और परीक्षा के लिए शुभकामनाएँ!'
          : 'Hello! I am your EduSpark Senior Buddy. Ready to help you master concepts and score full marks!';

      SpeechHelper.speak(testSentence, {
        textId: 'settings-voice-test',
        lang: currentSettings.defaultSpeechLang,
        rate: currentSettings.speechRate,
        pitch: currentSettings.speechPitch,
        onEnd: () => setIsPlayingTest(false),
        onError: () => setIsPlayingTest(false),
      });
    }
  };

  const handleResetDefaults = () => {
    SpeechHelper.stop();
    setIsPlayingTest(false);
    setCurrentSettings(DEFAULT_USER_SETTINGS);
    onUpdateSettings(DEFAULT_USER_SETTINGS);
    saveUserSettings(DEFAULT_USER_SETTINGS);
    SpeechHelper.setSettings({
      rate: DEFAULT_USER_SETTINGS.speechRate,
      pitch: DEFAULT_USER_SETTINGS.speechPitch,
      lang: DEFAULT_USER_SETTINGS.defaultSpeechLang,
    });
  };

  const activeThemeConfig = ACCENT_THEMES[currentSettings.accentColor] || ACCENT_THEMES.amber;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121216] border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#15151A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl theme-accent-bg-subtle border theme-accent-border-subtle flex items-center justify-center theme-accent-text shadow-xs">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="font-heading text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>User Preferences & Theme</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold theme-accent-bg-subtle theme-accent-text border theme-accent-border-subtle">
                  Customizer
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Personalize your theme mode, accent colors, Voice Buddy, and study workspace
              </p>
            </div>
          </div>

          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors cursor-pointer"
            aria-label="Close Settings Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-zinc-800/80 bg-[#0E0E12] px-5 pt-2 gap-2">
          <button
            id="tab-theme-settings"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'theme'
                ? 'text-zinc-100 border-[var(--theme-accent-500)] bg-[#121216]'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Display</span>
          </button>

          <button
            id="tab-audio-settings"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'audio'
                ? 'text-zinc-100 border-[var(--theme-accent-500)] bg-[#121216]'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice & Speech</span>
          </button>

          <button
            id="tab-study-settings"
            onClick={() => setActiveTab('study')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'study'
                ? 'text-zinc-100 border-[var(--theme-accent-500)] bg-[#121216]'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Study Effects</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-300 text-sm">
          {/* TAB 1: Theme & Display Settings */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              {/* SECTION: Dedicated Theme Mode Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <SunMedium className="w-3.5 h-3.5 theme-accent-text" />
                    <span>Study Environment & Color Mode</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    {currentSettings.colorMode === 'light' ? '☀️ Clean Light Active' : '🌙 Sophisticated Dark Active'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400">
                  Switch between eye-safe twilight dark mode and high-contrast paper-white light mode:
                </p>

                {/* 2-Card Mode Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card 1: Sophisticated Dark */}
                  <button
                    id="btn-theme-mode-dark"
                    onClick={() => handleSelectColorMode('dark')}
                    className={`relative p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                      currentSettings.colorMode === 'dark'
                        ? 'bg-zinc-900 border-[var(--theme-accent-500)] ring-2 ring-offset-2 ring-offset-[#121216] shadow-lg shadow-black/40'
                        : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full mb-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-105 transition-transform">
                        <Moon className="w-5 h-5 text-indigo-300" />
                      </div>
                      {currentSettings.colorMode === 'dark' ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-zinc-500 px-2 py-0.5">
                          Night Study
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="font-heading font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                        <span>Sophisticated Dark</span>
                        <span className="text-xs">🌙</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        Eye-safe twilight dark canvas with neon accent glows. Ideal for late-night sessions and reducing eye strain.
                      </p>
                    </div>

                    {/* Mini Visual Badge Preview */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-zinc-950 border border-zinc-700 inline-block" />
                      <span className="font-mono text-zinc-400">#09090B Charcoal</span>
                    </div>
                  </button>

                  {/* Card 2: Clean Light */}
                  <button
                    id="btn-theme-mode-light"
                    onClick={() => handleSelectColorMode('light')}
                    className={`relative p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                      currentSettings.colorMode === 'light'
                        ? 'bg-zinc-800/90 border-[var(--theme-accent-500)] ring-2 ring-offset-2 ring-offset-[#121216] shadow-lg'
                        : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-105 transition-transform">
                        <Sun className="w-5 h-5 text-amber-400" />
                      </div>
                      {currentSettings.colorMode === 'light' ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-zinc-500 px-2 py-0.5">
                          High Contrast
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="font-heading font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                        <span>Clean Light</span>
                        <span className="text-xs">☀️</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        High-contrast paper-white layout with crisp slate typography. Optimized for bright classrooms & sunny desks.
                      </p>
                    </div>

                    {/* Mini Visual Badge Preview */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-white border border-zinc-300 inline-block" />
                      <span className="font-mono text-zinc-400">#F8FAFC Paper White</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION: Accent Color Themes */}
              <div className="space-y-3 pt-2">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-1">
                    Choose UI Accent Palette
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Personalize buttons, badges, highlights, and study borders across both dark & light modes:
                  </p>
                </div>

                {/* Theme Swatches Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(ACCENT_THEMES) as AccentColor[]).map((colorKey) => {
                    const theme = ACCENT_THEMES[colorKey];
                    const isSelected = currentSettings.accentColor === colorKey;

                    return (
                      <button
                        key={colorKey}
                        id={`theme-swatch-${colorKey}`}
                        onClick={() => handleSelectAccent(colorKey)}
                        className={`relative p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-zinc-800/90 border-zinc-600 ring-2 ring-offset-2 ring-offset-[#121216]'
                            : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'
                        }`}
                        style={{
                          borderColor: isSelected ? theme.previewHex : undefined,
                        }}
                      >
                        {/* Color Preview Swatch Dot */}
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-transform group-hover:scale-110"
                          style={{ backgroundColor: theme.previewHex }}
                        >
                          {isSelected ? (
                            <Check className="w-4 h-4 text-white drop-shadow-sm font-bold" />
                          ) : null}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-100 text-sm">
                              {theme.label}
                            </span>
                            {isSelected && (
                              <span
                                className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: `${theme.previewHex}20`,
                                  color: theme.previewHex,
                                }}
                              >
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                            {theme.sublabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Interactive Preview Box */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Live Preview & Contrast Check</span>
                  <span className="text-xs font-mono text-zinc-500">
                    {currentSettings.colorMode === 'light' ? '☀️ Clean Light' : '🌙 Dark'} • {activeThemeConfig.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${activeThemeConfig.buttonBg} ${activeThemeConfig.buttonText} transition-all shadow-sm`}
                  >
                    Primary Action Button
                  </button>

                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${activeThemeConfig.badgeBg} ${activeThemeConfig.badgeText} border ${activeThemeConfig.badgeBorder}`}
                  >
                    Board Exam Hotspot • 10/10
                  </span>

                  <span className={`text-xs font-bold ${activeThemeConfig.primaryColor}`}>
                    Highlighted Key Concept ✨
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Voice & Speech Settings */}
          {activeTab === 'audio' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-1">
                  Voice Buddy & Read Aloud Engine
                </h3>
                <p className="text-xs text-zinc-400">
                  Tune how notes, quiz explanations, and teacher evaluations sound:
                </p>
              </div>

              {/* Speed Slider */}
              <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-200">Reading Speed</span>
                  <span className="font-mono font-bold theme-accent-text">
                    {currentSettings.speechRate.toFixed(2)}x
                  </span>
                </div>
                <input
                  id="slider-settings-speed"
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={currentSettings.speechRate}
                  onChange={(e) =>
                    handleSpeechChange({ speechRate: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[var(--theme-accent-500)]"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>0.7x (Slow / Beginner)</span>
                  <span>1.0x (Normal)</span>
                  <span>1.5x (Fast Revision)</span>
                </div>
              </div>

              {/* Pitch / Tone Slider */}
              <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-200">Voice Tone & Warmth</span>
                  <span className="font-bold theme-accent-text">
                    {currentSettings.speechPitch > 1.1
                      ? 'Upbeat & Enthusiastic'
                      : currentSettings.speechPitch < 0.95
                      ? 'Deep & Calm'
                      : 'Friendly & Warm (Default)'}
                  </span>
                </div>
                <input
                  id="slider-settings-pitch"
                  type="range"
                  min="0.75"
                  max="1.3"
                  step="0.05"
                  value={currentSettings.speechPitch}
                  onChange={(e) =>
                    handleSpeechChange({ speechPitch: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[var(--theme-accent-500)]"
                />
              </div>

              {/* Language Selection */}
              <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-2">
                <label className="block text-xs font-bold text-zinc-200 mb-1">
                  Default Language & Accent
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'en-IN', label: 'English (IN)', desc: 'Indian Accent' },
                    { id: 'te-IN', label: 'తెలుగు (Telugu)', desc: 'Regional Voice' },
                    { id: 'hi-IN', label: 'हिन्दी (Hindi)', desc: 'National Voice' },
                  ].map((langObj) => {
                    const isSelected = currentSettings.defaultSpeechLang === langObj.id;
                    return (
                      <button
                        key={langObj.id}
                        id={`btn-lang-${langObj.id}`}
                        onClick={() =>
                          handleSpeechChange({
                            defaultSpeechLang: langObj.id as 'en-IN' | 'te-IN' | 'hi-IN',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--theme-accent-subtle)] text-zinc-100 border-[var(--theme-accent-border)] font-bold'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div className="text-xs">{langObj.label}</div>
                        <div className="text-[10px] text-zinc-500">{langObj.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Test Audio Button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  id="btn-test-voice"
                  onClick={handleTestVoice}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    isPlayingTest
                      ? 'bg-rose-950/50 text-rose-300 border border-rose-700 animate-pulse'
                      : 'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  {isPlayingTest ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Stop Test Speech</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Test Voice Buddy 🔊</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] text-zinc-500">
                  Plays a quick sample sentence
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: Study Experience Preferences */}
          {activeTab === 'study' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-1">
                  Study Experience & Feedback
                </h3>
                <p className="text-xs text-zinc-400">
                  Configure motivation effects, shortcuts, and focus settings:
                </p>
              </div>

              {/* Confetti celebration toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-zinc-100">
                      Celebration Confetti
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Fires celebratory visual confetti when you achieve high quiz or assignment scores
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentSettings.showCelebrationConfetti}
                  onChange={(e) =>
                    handleSpeechChange({ showCelebrationConfetti: e.target.checked })
                  }
                  className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 accent-[var(--theme-accent-500)] cursor-pointer"
                />
              </div>

              {currentSettings.showCelebrationConfetti && (
                <div className="flex justify-end">
                  <button
                    id="btn-test-confetti"
                    onClick={() => fireDistinctionCelebration()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Test Celebration Blast 🎉</span>
                  </button>
                </div>
              )}

              {/* Sound effects toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs text-zinc-100">
                      Instant Feedback Audio Cues
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Provide quick audio feedback when answering MCQ options
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentSettings.soundEffects}
                  onChange={(e) =>
                    handleSpeechChange({ soundEffects: e.target.checked })
                  }
                  className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 accent-[var(--theme-accent-500)] cursor-pointer"
                />
              </div>

              {/* Focus mode shortcut tip */}
              <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 space-y-1.5 text-xs text-zinc-400">
                <div className="flex items-center gap-2 font-bold text-zinc-200">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Pro Tip for Deep Study</span>
                </div>
                <p>
                  Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-zinc-200">Esc</kbd> anytime to quickly exit Focus Mode and return to the main dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#15151A] flex items-center justify-between">
          <button
            id="btn-reset-settings"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Reset all options to original default settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            id="btn-done-settings"
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-950 hover:bg-white transition-all shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Done & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
