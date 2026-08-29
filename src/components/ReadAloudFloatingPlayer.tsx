import React, { useState, useEffect } from 'react';
import { SpeechHelper, SpeechStatus, VoiceOption } from '../utils/speech';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Sliders,
  Sparkles,
  Check,
  Languages,
} from 'lucide-react';

interface ReadAloudFloatingPlayerProps {
  currentText?: string;
  title?: string;
  subtitle?: string;
  lang?: 'en-IN' | 'te-IN' | 'hi-IN' | 'en-US';
  onLanguageChange?: (lang: 'en-IN' | 'te-IN' | 'hi-IN' | 'en-US') => void;
}

export const ReadAloudFloatingPlayer: React.FC<ReadAloudFloatingPlayerProps> = ({
  currentText,
  title = 'Read Aloud Player',
  subtitle,
  lang = 'en-IN',
  onLanguageChange,
}) => {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [speed, setSpeed] = useState<number>(0.95);
  const [pitch, setPitch] = useState<number>(1.05);
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');

  useEffect(() => {
    // Subscribe to speech state changes
    const unsubscribe = SpeechHelper.subscribe((newStatus, textId) => {
      setStatus(newStatus);
      setActiveId(textId);
    });

    // Populate voices
    const loadVoices = () => {
      const available = SpeechHelper.getAvailableVoices();
      setVoices(available);
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handlePlayToggle = () => {
    if (status === 'speaking') {
      SpeechHelper.pause();
    } else if (status === 'paused') {
      SpeechHelper.resume();
    } else if (currentText) {
      SpeechHelper.speak(currentText, {
        textId: 'main-player',
        lang,
        rate: speed,
        pitch,
        voiceURI: selectedVoiceURI || undefined,
      });
    }
  };

  const handleStop = () => {
    SpeechHelper.stop();
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    SpeechHelper.setSettings({ rate: newSpeed });
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    SpeechHelper.setSettings({ pitch: newPitch });
  };

  const isPlaying = status === 'speaking';
  const isPaused = status === 'paused';
  const isActive = isPlaying || isPaused;

  if (!SpeechHelper.isSupported()) {
    return null;
  }

  // Only show if there is something to read or currently active
  if (!currentText && !isActive) {
    return null;
  }

  return (
    <aside
      aria-label="Read Aloud Controller"
      className="fixed bottom-6 right-6 z-40 max-w-sm w-[calc(100vw-3rem)] sm:w-80 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-[#121216] border border-amber-500/40 rounded-3xl p-4 shadow-2xl shadow-amber-500/10 backdrop-blur-xl space-y-3">
        {/* Top bar: Title + status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-amber-400 animate-ping' : isPaused ? 'bg-amber-600' : 'bg-zinc-600'}`} />
            <span className="text-xs font-extrabold text-zinc-100 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice Buddy 🎙️</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-voice-settings-toggle"
              onClick={() => setShowSettings((prev) => !prev)}
              className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Voice Settings & Speed"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {isActive && (
              <button
                id="btn-voice-stop"
                onClick={handleStop}
                className="p-1.5 rounded-xl bg-zinc-800/80 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer"
                title="Stop Audio"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
          </div>
        </div>

        {/* Content info */}
        <div>
          <h4 className="text-xs font-bold text-zinc-200 line-clamp-1">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] text-zinc-400 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            <button
              id="btn-voice-play-toggle"
              onClick={handlePlayToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-md ${
                isPlaying
                  ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:opacity-95'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            {/* Quick Speed Pills */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[10px] font-bold">
              {[0.85, 1.0, 1.25].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    Math.abs(speed - s) < 0.05
                      ? 'bg-amber-500 text-zinc-950 font-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-amber-400/90 font-medium">
            {lang === 'te-IN' ? 'తెలుగు' : lang === 'hi-IN' ? 'हिन्दी' : 'English (IN)'}
          </div>
        </div>

        {/* Expandable Settings */}
        {showSettings && (
          <div className="p-3 bg-zinc-900/95 border border-zinc-800 rounded-2xl space-y-3 text-xs animate-in fade-in duration-200">
            {/* Speed Slider */}
            <div>
              <div className="flex justify-between text-zinc-400 text-[11px] mb-1">
                <span>Reading Speed</span>
                <span className="text-amber-300 font-bold">{speed.toFixed(2)}x</span>
              </div>
              <input
                id="slider-voice-speed"
                type="range"
                min="0.6"
                max="1.6"
                step="0.05"
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Pitch Slider (Friendly / Warm Tone) */}
            <div>
              <div className="flex justify-between text-zinc-400 text-[11px] mb-1">
                <span>Voice Tone & Warmth</span>
                <span className="text-amber-300 font-bold">
                  {pitch > 1.1 ? 'Upbeat' : pitch < 0.95 ? 'Calm' : 'Friendly'}
                </span>
              </div>
              <input
                id="slider-voice-pitch"
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={pitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Language Switch */}
            {onLanguageChange && (
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1.5 font-medium">
                  Accent & Language
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onLanguageChange('en-IN')}
                    className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                      lang === 'en-IN'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    English (IN)
                  </button>
                  <button
                    onClick={() => onLanguageChange('te-IN')}
                    className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                      lang === 'te-IN'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-telugu'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200 font-telugu'
                    }`}
                  >
                    తెలుగు
                  </button>
                  <button
                    onClick={() => onLanguageChange('hi-IN')}
                    className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                      lang === 'hi-IN'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
