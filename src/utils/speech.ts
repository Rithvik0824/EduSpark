// Web Speech API helper for reading notes, quiz solutions, and evaluations aloud in friendly clear voice

export interface SpeechSettings {
  rate: number; // 0.5 to 2.0 (default 1.0)
  pitch: number; // 0.5 to 1.5 (default 1.05 for friendly tone)
  lang: 'en-IN' | 'en-US' | 'te-IN' | 'hi-IN';
  voiceURI?: string;
}

export type SpeechStatus = 'idle' | 'speaking' | 'paused';

export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  isIndian: boolean;
  isFriendly: boolean;
}

export class SpeechHelper {
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static activeStatus: SpeechStatus = 'idle';
  private static listeners: Set<(status: SpeechStatus, activeTextId?: string) => void> = new Set();
  private static activeTextId?: string;

  // Persisted user preference
  private static currentSettings: SpeechSettings = {
    rate: 0.95,
    pitch: 1.05, // Slightly higher pitch for friendly warm tone
    lang: 'en-IN',
  };

  static isSupported(): boolean {
    return !!this.synth;
  }

  static getStatus(): SpeechStatus {
    return this.activeStatus;
  }

  static getActiveTextId(): string | undefined {
    return this.activeTextId;
  }

  static subscribe(listener: (status: SpeechStatus, activeTextId?: string) => void): () => void {
    this.listeners.add(listener);
    // immediately call with current status
    listener(this.activeStatus, this.activeTextId);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(status: SpeechStatus, textId?: string) {
    this.activeStatus = status;
    this.activeTextId = textId;
    this.listeners.forEach((fn) => fn(status, textId));
  }

  static getAvailableVoices(): VoiceOption[] {
    if (!this.synth) return [];
    const rawVoices = this.synth.getVoices();
    return rawVoices.map((v) => {
      const isIndian =
        v.lang.startsWith('en-IN') ||
        v.lang.startsWith('te') ||
        v.lang.startsWith('hi') ||
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('ravi') ||
        v.name.toLowerCase().includes('heera') ||
        v.name.toLowerCase().includes('veena') ||
        v.name.toLowerCase().includes('priya');
      
      const isFriendly =
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('google') ||
        v.name.toLowerCase().includes('neural') ||
        v.name.toLowerCase().includes('siri') ||
        isIndian;

      return {
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI,
        isIndian,
        isFriendly,
      };
    });
  }

  static setSettings(newSettings: Partial<SpeechSettings>) {
    this.currentSettings = { ...this.currentSettings, ...newSettings };
  }

  static getSettings(): SpeechSettings {
    return { ...this.currentSettings };
  }

  /**
   * Speak arbitrary text with friendly voice tuning, natural pauses, and events
   */
  static speak(
    text: string,
    options: {
      textId?: string;
      lang?: 'en-IN' | 'te-IN' | 'hi-IN' | 'en-US';
      rate?: number;
      pitch?: number;
      voiceURI?: string;
      onEnd?: () => void;
      onError?: () => void;
    } = {}
  ) {
    if (!this.synth) {
      if (options.onError) options.onError();
      return;
    }

    // Stop any existing playback
    this.stop();

    // Clean text from markdown marks, URLs, emoji clutter to make it sound warm and conversational
    const cleanText = text
      .replace(/[*#_`~\[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (options.onEnd) options.onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = options.lang || this.currentSettings.lang;
    utterance.lang = targetLang;
    utterance.rate = options.rate ?? this.currentSettings.rate;
    utterance.pitch = options.pitch ?? this.currentSettings.pitch;

    // Pick best voice
    const voices = this.synth.getVoices();
    if (voices && voices.length > 0) {
      if (options.voiceURI || this.currentSettings.voiceURI) {
        const uri = options.voiceURI || this.currentSettings.voiceURI;
        const matched = voices.find((v) => v.voiceURI === uri);
        if (matched) utterance.voice = matched;
      }

      if (!utterance.voice) {
        if (targetLang === 'te-IN') {
          const teluguVoice = voices.find(
            (v) => v.lang.includes('te') || v.name.toLowerCase().includes('telugu')
          );
          if (teluguVoice) utterance.voice = teluguVoice;
        } else if (targetLang === 'hi-IN') {
          const hindiVoice = voices.find(
            (v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('kalpana')
          );
          if (hindiVoice) utterance.voice = hindiVoice;
        } else {
          // Indian English preferred
          const indianVoice = voices.find(
            (v) =>
              (v.lang === 'en-IN' || v.name.toLowerCase().includes('india')) &&
              !v.name.toLowerCase().includes('microsoft david')
          );
          const naturalVoice = voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.toLowerCase().includes('google') ||
                v.name.toLowerCase().includes('natural') ||
                v.name.toLowerCase().includes('samantha') ||
                v.name.toLowerCase().includes('karen'))
          );
          utterance.voice = indianVoice || naturalVoice || null;
        }
      }
    }

    utterance.onstart = () => {
      this.notify('speaking', options.textId);
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.notify('idle', undefined);
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      // If manually canceled, treat as idle
      this.currentUtterance = null;
      this.notify('idle', undefined);
      if (options.onError && e.error !== 'canceled' && e.error !== 'interrupted') {
        options.onError();
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  static pause() {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.notify('paused', this.activeTextId);
    }
  }

  static resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.notify('speaking', this.activeTextId);
    }
  }

  static stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.notify('idle', undefined);
    }
  }

  static isSpeaking(): boolean {
    return !!this.synth && (this.synth.speaking || this.activeStatus === 'speaking');
  }

  static isPaused(): boolean {
    return !!this.synth && this.synth.paused;
  }
}
