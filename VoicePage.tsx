import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sliders,
  RotateCcw,
  Radio,
  Settings,
  Square,
  Play,
  Copy,
  Check,
  Zap,
  Activity,
  Globe,
  ChevronDown
} from 'lucide-react';
import { ZenoOrb, OrbState } from '../components/ZenoOrb';
import { apiFetch, getStoredToken } from '../lib/api';

interface TranscriptItem {
  id: string;
  speaker: 'user' | 'zeno';
  text: string;
  time: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  stopWordsRegex: RegExp;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    stopWordsRegex: /\b(stop|pause|shut up|wait|hold on|quiet|hush|cancel|enough|silence|ಸಾಕು|ನಿಲ್ಲಿಸು|ತಡಿ|ನಿಲ್ಲು|ಬೇಡ|ಮಾತನಾಡಬೇಡ|ಶಾಂತ)\b/i
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    stopWordsRegex: /\b(stop|pause|shut up|wait|hold on|quiet|hush|cancel|enough|silence|रुको|रोको|बस|चुप|बंद करो|थम जाओ|शांत रहो)\b/i
  },
  {
    code: 'en-IN',
    name: 'Indian English',
    nativeName: 'English (India)',
    flag: '🇮🇳',
    stopWordsRegex: /\b(stop|pause|shut up|wait|hold on|quiet|hush|cancel|enough|stop it|silence)\b/i
  },
  {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    stopWordsRegex: /\b(stop|pause|shut up|wait|hold on|quiet|hush|cancel|enough|stop it|silence)\b/i
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    stopWordsRegex: /\b(stop|pause|shut up|wait|நிறுத்து|போதும்|அமைதி)\b/i
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    stopWordsRegex: /\b(stop|pause|shut up|wait|ఆపు|చాలు|శాంతంగా)\b/i
  },
  {
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    stopWordsRegex: /\b(stop|pause|shut up|wait|നിർത്തೂ|മതി)\b/i
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    stopWordsRegex: /\b(stop|pause|shut up|wait|थांब|थांबा|पुरे|शांत)\b/i
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    stopWordsRegex: /\b(stop|pause|shut up|wait|থামো|ব্যাস|চুপ)\b/i
  }
];

export const VoicePage: React.FC = () => {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    return localStorage.getItem('zeno_voice_lang') || 'kn-IN';
  });
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [voiceRate, setVoiceRate] = useState<number>(() => {
    const saved = localStorage.getItem('zeno_voice_rate');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [voicePitch, setVoicePitch] = useState<number>(() => {
    const saved = localStorage.getItem('zeno_voice_pitch');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    return localStorage.getItem('zeno_voice_name') || '';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // References to handle async loops without closure stale states
  const conversationIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSessionActiveRef = useRef(false);
  const isZenoSpeakingRef = useRef(false);
  const ignoreRecognitionUntilRef = useRef<number>(0);
  const recentSpokenPhrasesRef = useRef<string[]>([]);
  const transcriptsEndRef = useRef<HTMLDivElement>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Anti-freeze chunking and watchdog references
  const speechQueueRef = useRef<string[]>([]);
  const keepAliveIntervalRef = useRef<any>(null);
  const sentenceWatchdogRef = useRef<any>(null);
  const selectedLangRef = useRef<string>(selectedLang);

  // Keep refs synchronized
  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  const getVoiceQualityScore = (voice: SpeechSynthesisVoice, targetLang: string): number => {
    let score = 0;
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();
    const target = targetLang.toLowerCase();
    const targetPrefix = target.split('-')[0];

    // Direct language matching is highest priority
    if (lang === target || lang.replace('_', '-') === target) {
      score += 200;
    } else if (lang.startsWith(targetPrefix)) {
      score += 120;
    }

    // High quality neural & online natural voices
    if (name.includes('online (natural)') || name.includes('online natural')) score += 80;
    if (name.includes('neural')) score += 70;
    if (name.includes('natural')) score += 50;
    if (name.includes('google')) score += 40;
    if (name.includes('microsoft')) score += 35;

    // Indian language specialized voice models
    if (name.includes('swara') || name.includes('madhur') || name.includes('neerja') || name.includes('prabhat')) score += 60;
    if (name.includes('sapna') || name.includes('aarav') || name.includes('kavya')) score += 60;
    if (name.includes('jenny') || name.includes('guy') || name.includes('aria')) score += 30;

    return score;
  };

  // Load and rank high-fidelity Natural / Neural speech synthesis voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const currentTarget = selectedLangRef.current;
      const sorted = [...voices].sort((a, b) => {
        const aScore = getVoiceQualityScore(a, currentTarget);
        const bScore = getVoiceQualityScore(b, currentTarget);
        return bScore - aScore;
      });

      setAvailableVoices(sorted);

      // Select top voice matching target language
      const savedName = localStorage.getItem('zeno_voice_name');
      const foundSaved = sorted.find(v => v.name === savedName);
      const isSavedMatchingLang = foundSaved && (
        foundSaved.lang.toLowerCase().startsWith(currentTarget.toLowerCase().slice(0, 2))
      );

      if (isSavedMatchingLang && foundSaved) {
        setSelectedVoiceName(foundSaved.name);
      } else if (sorted.length > 0) {
        setSelectedVoiceName(sorted[0].name);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      stopSpeakingImmediately();
    };
  }, [selectedLang]);

  // Acoustic Echo Cancellation: check if user speech matches agent's own recent speech
  const isSelfVoiceEcho = (transcript: string): boolean => {
    const normTrans = transcript.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
    if (!normTrans || normTrans.length < 3) return false;

    for (const spoken of recentSpokenPhrasesRef.current) {
      if (!spoken) continue;
      // Direct substring match
      if (spoken.includes(normTrans)) {
        return true;
      }
      // High word overlap (70%+ of words in transcript were uttered by agent)
      const words = normTrans.split(' ').filter(w => w.length > 2);
      if (words.length >= 2) {
        let matched = 0;
        for (const w of words) {
          if (spoken.includes(w)) matched++;
        }
        if (matched / words.length >= 0.7) {
          return true;
        }
      }
    }
    return false;
  };

  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, currentSpeech]);

  // Clean conversational text for natural speech synthesis
  const sanitizeTextForSpeech = (rawText: string): string => {
    return rawText
      .replace(/```[\s\S]*?```/g, 'I have provided the code in your transcript.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/(\d+(\.\d+)?)°C/gi, '$1 degrees Celsius')
      .replace(/(\d+)%/g, '$1 percent')
      .replace(/(\d+)km\/h/gi, '$1 kilometers per hour')
      .replace(/[•\-_—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Immediate interruption / Barge-in stop
  const stopSpeakingImmediately = () => {
    speechQueueRef.current = [];
    if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    if (sentenceWatchdogRef.current) clearTimeout(sentenceWatchdogRef.current);

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    isZenoSpeakingRef.current = false;
    activeUtteranceRef.current = null;
    ignoreRecognitionUntilRef.current = Date.now() + 350;
  };

  // Ensure an active persistent voice conversation session exists
  const getOrCreateVoiceConversation = async (): Promise<string> => {
    if (conversationIdRef.current) return conversationIdRef.current;

    try {
      const data = await apiFetch('/api/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: `Voice Session: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          mode: 'voice'
        })
      });
      conversationIdRef.current = data.conversation.id;
      return data.conversation.id;
    } catch {
      const fallbackId = 'voice-conv-' + Date.now();
      conversationIdRef.current = fallbackId;
      return fallbackId;
    }
  };

  // Voice Speech Synthesizer Output with Sentence Chunking & Anti-Freeze Heartbeat Watchdog
  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window) || isMuted) {
      setOrbState(isSessionActiveRef.current ? 'listening' : 'idle');
      return;
    }

    stopSpeakingImmediately();

    const clean = sanitizeTextForSpeech(text);
    if (!clean) {
      setOrbState(isSessionActiveRef.current ? 'listening' : 'idle');
      return;
    }

    // Register into echo cancellation history
    const normSpoken = clean.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
    recentSpokenPhrasesRef.current.push(normSpoken);
    if (recentSpokenPhrasesRef.current.length > 5) {
      recentSpokenPhrasesRef.current.shift();
    }

    // Natural sentence chunking (includes '.', '!', '?', newline, and Indian danda '।')
    const rawChunks = clean.match(/[^.!?\n\u0964]+[.!?\n\u0964]+|[^.!?\n\u0964]+$/g) || [clean];
    const chunks = rawChunks.map(c => c.trim()).filter(c => c.length > 0);

    if (chunks.length === 0) {
      setOrbState(isSessionActiveRef.current ? 'listening' : 'idle');
      return;
    }

    speechQueueRef.current = chunks;
    isZenoSpeakingRef.current = true;
    setOrbState('speaking');

    // Heartbeat Keep-Alive to fix Chromium SpeechSynthesis 15-second freeze bug
    if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    keepAliveIntervalRef.current = setInterval(() => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 4000);

    // Sequential Sentence Queue Player
    const playNextChunk = () => {
      if (!isZenoSpeakingRef.current) return;

      if (speechQueueRef.current.length === 0) {
        // Speech playback completed successfully
        if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
        if (sentenceWatchdogRef.current) clearTimeout(sentenceWatchdogRef.current);
        isZenoSpeakingRef.current = false;
        activeUtteranceRef.current = null;
        ignoreRecognitionUntilRef.current = Date.now() + 400;

        if (isSessionActiveRef.current) {
          setOrbState('listening');
        } else {
          setOrbState('idle');
        }
        return;
      }

      const chunk = speechQueueRef.current.shift()!;
      const utterance = new SpeechSynthesisUtterance(chunk);
      activeUtteranceRef.current = utterance;

      const matchedVoice = availableVoices.find(v => v.name === selectedVoiceName) ||
        availableVoices.find(v => v.lang.toLowerCase().startsWith(selectedLangRef.current.toLowerCase().slice(0, 2)));

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      utterance.rate = voiceRate;
      utterance.pitch = voicePitch;
      utterance.lang = selectedLangRef.current;

      // Watchdog timer: If an utterance hangs in the browser engine, force advance
      if (sentenceWatchdogRef.current) clearTimeout(sentenceWatchdogRef.current);
      const watchdogMs = Math.max(7000, chunk.length * 150);
      sentenceWatchdogRef.current = setTimeout(() => {
        console.warn('[SpeechSynthesis] Chunk watchdog timeout elapsed, advancing sentence queue.');
        try { window.speechSynthesis.cancel(); } catch {}
        playNextChunk();
      }, watchdogMs);

      utterance.onend = () => {
        if (sentenceWatchdogRef.current) clearTimeout(sentenceWatchdogRef.current);
        // Realistic human breath cadence pause between sentences (120ms)
        setTimeout(() => {
          if (isZenoSpeakingRef.current) {
            playNextChunk();
          }
        }, 120);
      };

      utterance.onerror = (e) => {
        console.warn('[SpeechSynthesis Chunk Error]:', e);
        if (sentenceWatchdogRef.current) clearTimeout(sentenceWatchdogRef.current);
        setTimeout(() => {
          if (isZenoSpeakingRef.current) {
            playNextChunk();
          }
        }, 100);
      };

      window.speechSynthesis.speak(utterance);
    };

    playNextChunk();
  };

  // Call REAL Backend AI Router & Stream Response
  const processUserQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    stopSpeakingImmediately();
    setOrbState('thinking');
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = 'msg-' + Date.now();
    setTranscripts(prev => [...prev, { id: userMsgId, speaker: 'user', text: queryText, time: userTime }]);

    try {
      const convId = await getOrCreateVoiceConversation();
      const token = getStoredToken();

      // Stream the response from the real AI Router with active language parameter
      const response = await fetch(`/api/chat/conversations/${convId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          content: queryText,
          mode: 'voice',
          model: 'auto',
          language: selectedLangRef.current
        })
      });

      if (!response.ok) {
        throw new Error(`AI Gateway responded with HTTP status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedAnswer = '';
      let buffer = '';

      if (reader) {
        let done = false;
        let currentEvent = 'message';

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('event:')) {
                currentEvent = trimmed.replace('event:', '').trim();
              } else if (trimmed.startsWith('data:')) {
                const dataStr = trimmed.replace('data:', '').trim();
                try {
                  const parsed = JSON.parse(dataStr);
                  if (currentEvent === 'token') {
                    if (parsed.delta) streamedAnswer += parsed.delta;
                  } else if (currentEvent === 'weather' && !streamedAnswer) {
                    streamedAnswer = `The weather in ${parsed.location} is currently ${parsed.temperature} degrees Celsius and ${parsed.conditionLabel}. `;
                  } else if (currentEvent === 'location' && !streamedAnswer) {
                    streamedAnswer = `Your verified location is ${parsed.name}. `;
                  }
                } catch {}
              }
            }
          }
        }
      }

      const finalText = streamedAnswer.trim() || `I have processed your query regarding ${queryText}. What would you like to explore next?`;
      const zenoTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const zenoMsgId = 'zeno-' + Date.now();
      setTranscripts(prev => [...prev, { id: zenoMsgId, speaker: 'zeno', text: finalText, time: zenoTime }]);

      // Speak response aloud naturally
      speakResponse(finalText);
    } catch (err: any) {
      console.error('[VoiceAgent Query Error]:', err);
      const isKn = selectedLangRef.current.startsWith('kn');
      const isHi = selectedLangRef.current.startsWith('hi');
      const errorReply = isKn
        ? "ಸಂಪರ್ಕದಲ್ಲಿ ಸಣ್ಣ ವ್ಯತ್ಯಾಸವಾಗಿದೆ, ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ?"
        : isHi
        ? "कनेक्शन में थोड़ी देरी हुई है, क्या आप कृपया दोहरा सकते हैं?"
        : "I encountered a transient connection delay with the AI gateway. Could you please repeat that?";

      const zenoTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTranscripts(prev => [...prev, { id: 'err-' + Date.now(), speaker: 'zeno', text: errorReply, time: zenoTime }]);
      speakResponse(errorReply);
    }
  };

  // Start continuous conversational speech recognition with Barge-in & Stop Detection
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    stopSpeakingImmediately();
    setIsSessionActive(true);
    setOrbState('listening');

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLangRef.current;

      recognition.onstart = () => {
        if (!isZenoSpeakingRef.current) {
          setOrbState('listening');
        }
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const candidate = (finalStr || interim).trim();
        if (!candidate) return;

        // 1. UNIVERSAL BARGE-IN "STOP" COMMAND DETECTION (English, Kannada, Hindi, Tamil, Telugu, etc.)
        const universalStopRegex = /\b(stop|pause|shut up|wait|hold on|quiet|hush|cancel|enough|silence|stop it|ಸಾಕು|ನಿಲ್ಲಿಸು|ತಡಿ|ನಿಲ್ಲು|ಬೇಡ|ಮಾತನಾಡಬೇಡ|ಶಾಂತ|ರುಕೋ|रोको|बस|चुप|बंद करो|थम जाओ|शांत रहो|நிறுத்து|போதும்|ஆపు|చాలు|थांब|थांबा|ಪುರೆ|മതി)\b/i;
        const activeLangConfig = SUPPORTED_LANGUAGES.find(l => l.code === selectedLangRef.current);
        const isStopCommand = universalStopRegex.test(candidate) || (activeLangConfig?.stopWordsRegex.test(candidate) ?? false);

        if (isStopCommand) {
          console.log('[VoiceAgent] Barge-in STOP word detected:', candidate);
          stopSpeakingImmediately();
          setOrbState('listening');
          setCurrentSpeech('Interrupted. Listening to you...');
          setTimeout(() => setCurrentSpeech(''), 1500);
          return;
        }

        // 2. FULL-DUPLEX INTERRUPTION WHILE AGENT IS SPEAKING
        if (isZenoSpeakingRef.current) {
          // Acoustic echo filter: ignore audio picked up from the speaker
          if (isSelfVoiceEcho(candidate)) {
            return;
          }
          // If user speaks an intentional interruption (> 1 word or > 4 characters)
          if (finalStr.trim() && (finalStr.trim().split(/\s+/).length >= 2 || finalStr.trim().length >= 5)) {
            console.log('[VoiceAgent] User barge-in question detected during playback:', finalStr.trim());
            stopSpeakingImmediately();
            setCurrentSpeech('');
            processUserQuery(finalStr.trim());
            return;
          }
          return;
        }

        // 3. NORMAL CONVERSATIONAL USER SPEECH
        if (finalStr.trim()) {
          const userFinal = finalStr.trim();
          if (isSelfVoiceEcho(userFinal)) {
            setCurrentSpeech('');
            return;
          }
          // Ambient noise filter: ignore short 1-letter noise artifacts
          if (userFinal.length < 2) {
            setCurrentSpeech('');
            return;
          }
          setCurrentSpeech('');
          processUserQuery(userFinal);
        } else if (interim) {
          if (!isSelfVoiceEcho(interim.trim())) {
            setCurrentSpeech(interim);
          }
        }
      };

      // Ambient noise tolerance: ignore non-fatal silence and temporary noise glitches
      recognition.onerror = (e: any) => {
        if (e.error === 'no-speech' || e.error === 'aborted') {
          return;
        }
        console.warn('[SpeechRecognition Notice]:', e.error);
        if (e.error === 'audio-capture' || e.error === 'network') {
          setTimeout(() => {
            if (isSessionActiveRef.current) {
              try { recognition.start(); } catch {}
            }
          }, 500);
        }
      };

      recognition.onend = () => {
        // Automatic continuous reconnection with debounce
        if (isSessionActiveRef.current) {
          setTimeout(() => {
            if (isSessionActiveRef.current) {
              try {
                recognition.start();
              } catch {}
            }
          }, 200);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition init failed:', err);
      setIsSessionActive(false);
      setOrbState('idle');
    }
  };

  const stopListening = () => {
    setIsSessionActive(false);
    stopSpeakingImmediately();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setOrbState('idle');
    setCurrentSpeech('');
  };

  const toggleVoiceSession = () => {
    if (isSessionActive) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Immediate barge-in tap on Orb
  const handleOrbClick = () => {
    if (isZenoSpeakingRef.current) {
      stopSpeakingImmediately();
      setOrbState('listening');
      if (isSessionActive) {
        try { recognitionRef.current?.start(); } catch {}
      }
    } else {
      toggleVoiceSession();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLanguageChange = (langCode: string) => {
    setSelectedLang(langCode);
    selectedLangRef.current = langCode;
    localStorage.setItem('zeno_voice_lang', langCode);
    setShowLangMenu(false);

    // Update active speech recognition language immediately
    if (recognitionRef.current) {
      recognitionRef.current.lang = langCode;
    }

    // Select the best neural voice for this language
    if (availableVoices.length > 0) {
      const best = [...availableVoices].sort((a, b) => {
        return getVoiceQualityScore(b, langCode) - getVoiceQualityScore(a, langCode);
      })[0];
      if (best) {
        setSelectedVoiceName(best.name);
        localStorage.setItem('zeno_voice_name', best.name);
      }
    }
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-b from-[#07080b] via-[#090b10] to-[#0d1017]">
      {/* Top Header Bar */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/10 glass-panel shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isSessionActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="font-semibold text-sm tracking-wide text-white">
              ZENO Conversational Voice Agent
            </span>
          </div>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase border transition-colors
            ${isSessionActive
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-white/5 text-slate-400 border-white/10'
            }
          `}>
            {isSessionActive ? 'Continuous Dialogue Active' : 'Voice Standby'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Multilingual Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 text-xs font-medium text-slate-200 transition"
              title="Change Voice Dialogue Language"
            >
              <span>{currentLangObj.flag}</span>
              <span className="font-semibold">{currentLangObj.nativeName}</span>
              <span className="text-slate-400 text-[11px]">({currentLangObj.name})</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel-elevated p-2 border border-white/15 shadow-2xl backdrop-blur-xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1">
                  Select Spoken Language
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                      selectedLang === lang.code
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <div className="text-left">
                        <div className="font-medium">{lang.nativeName}</div>
                        <div className="text-[10px] text-slate-400">{lang.name}</div>
                      </div>
                    </div>
                    {selectedLang === lang.code && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Barge-in Stop Button (visible while ZENO speaks) */}
          {isZenoSpeakingRef.current && (
            <button
              onClick={stopSpeakingImmediately}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold animate-pulse hover:bg-rose-500/30 transition shadow-lg shadow-rose-500/10"
              title="Interrupt speech (or say 'stop')"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop / Interrupt</span>
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl glass-card text-slate-400 hover:text-white hover:border-cyan-500/40 transition"
            title="Voice Calibration & Neural Synthesizer Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!isMuted) stopSpeakingImmediately();
              setIsMuted(!isMuted);
            }}
            className={`p-2 rounded-xl glass-card transition ${isMuted ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : 'text-slate-400 hover:text-white'}`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Interactive Orb Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative select-none">
        {/* Interactive Holographic ZENO AI Orb with Ripple Glow */}
        <div
          className="cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 relative group"
          onClick={handleOrbClick}
          title={isZenoSpeakingRef.current ? "Tap to interrupt ZENO" : (isSessionActive ? "Tap to pause session" : "Tap to speak")}
        >
          {/* Ambient Acoustic Energy Field */}
          <div
            className={`absolute -inset-10 rounded-full blur-3xl pointer-events-none transition-all duration-700
              ${orbState === 'listening'
                ? 'bg-emerald-500/25 animate-pulse'
                : orbState === 'thinking'
                ? 'bg-purple-500/30 animate-spin-slow'
                : orbState === 'speaking'
                ? 'bg-cyan-500/35 animate-ping-slow'
                : 'bg-indigo-500/10'
              }
            `}
          />
          <ZenoOrb size="xl" state={orbState} />
        </div>

        {/* Dynamic Voice State Indicator */}
        <div className="mt-8 text-center space-y-2.5 max-w-lg">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-xs font-mono tracking-widest uppercase shadow-lg">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                orbState === 'listening'
                  ? 'bg-emerald-400 animate-ping'
                  : orbState === 'thinking'
                  ? 'bg-purple-400 animate-pulse'
                  : orbState === 'speaking'
                  ? 'bg-cyan-400 animate-bounce'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-200 font-semibold">
              {orbState === 'listening' && `Listening in ${currentLangObj.nativeName}... Speak anytime`}
              {orbState === 'thinking' && 'ZENO is reasoning & synthesizing...'}
              {orbState === 'speaking' && "Speaking • Say 'Stop' or tap to interrupt"}
              {orbState === 'idle' && (isSessionActive ? 'Ready for speech' : 'Tap Orb or Button Below to Start')}
              {orbState === 'error' && 'Gateway issue, reconnecting...'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <span>Barge-in active: say</span>
            <span className="text-cyan-300 font-mono font-semibold">"Stop"</span>
            <span>or</span>
            <span className="text-cyan-300 font-mono font-semibold">
              {selectedLang.startsWith('kn') ? '"ಸಾಕು" / "ನಿಲ್ಲಿಸು"' : selectedLang.startsWith('hi') ? '"रुको" / "बस"' : '"Pause"'}
            </span>
            <span>anytime to interrupt</span>
          </div>

          {currentSpeech && (
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-sm italic font-medium animate-in fade-in duration-150">
              "{currentSpeech}"
            </div>
          )}
        </div>

        {/* Primary Controls */}
        <div className="mt-7 flex items-center gap-3">
          <button
            onClick={toggleVoiceSession}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 shadow-xl
              ${isSessionActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-rose-500/20'
                : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white hover:shadow-cyan-500/30 hover:scale-105'
              }
            `}
          >
            {isSessionActive ? (
              <>
                <MicOff className="w-4 h-4 text-rose-400" />
                <span>End Voice Session</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-white" />
                <span>Start Continuous Voice Dialogue</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Conversation Transcript Drawer */}
      <div className="h-52 border-t border-white/10 glass-panel p-4 flex flex-col shrink-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Dialogue Transcript</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-mono text-[10px]">{transcripts.length} exchanges</span>
            {transcripts.length > 0 && (
              <button
                onClick={() => setTranscripts([])}
                className="text-[10px] text-slate-400 hover:text-white transition"
              >
                Clear History
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 text-xs">
          {transcripts.length === 0 ? (
            <div className="text-slate-500 italic text-center py-6">
              Tap "Start Continuous Voice Dialogue" to speak naturally with ZENO AI in {currentLangObj.nativeName} ({currentLangObj.name}) or any supported language.
            </div>
          ) : (
            transcripts.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-xl flex items-start gap-3 group transition-all
                  ${t.speaker === 'user' ? 'bg-white/5 text-slate-200' : 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/20'}
                `}
              >
                <span className="font-mono text-xs font-bold shrink-0 mt-0.5">
                  {t.speaker === 'user' ? '👤' : '✦'}
                </span>
                <div className="flex-1 leading-relaxed">
                  <p>{t.text}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => speakResponse(t.text)}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    title="Re-speak this message"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleCopy(t.id, t.text)}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    title="Copy text"
                  >
                    {copiedId === t.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 font-mono">{t.time}</span>
              </div>
            ))
          )}
          <div ref={transcriptsEndRef} />
        </div>
      </div>

      {/* Voice Calibration & Synthesizer Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Voice Synthesizer Calibration</span>
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white px-2 py-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center justify-between">
                  <span>Neural / Natural Synthesizer Voice</span>
                  <span className="text-[10px] text-cyan-400 font-mono">{availableVoices.length} installed</span>
                </label>
                <select
                  value={selectedVoiceName}
                  onChange={e => {
                    setSelectedVoiceName(e.target.value);
                    localStorage.setItem('zeno_voice_name', e.target.value);
                  }}
                  className="w-full p-2.5 rounded-xl glass-input text-xs text-white bg-black/60 border border-white/10 focus:outline-none"
                >
                  {availableVoices.map((v, idx) => (
                    <option key={idx} value={v.name} className="bg-slate-900 text-white">
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Conversational Speed (Rate)</span>
                  <span className="font-mono text-cyan-400">{voiceRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.4}
                  step={0.05}
                  value={voiceRate}
                  onChange={e => {
                    const r = Number(e.target.value);
                    setVoiceRate(r);
                    localStorage.setItem('zeno_voice_rate', r.toString());
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.8x (Deliberate)</span>
                  <span>1.0x (Standard)</span>
                  <span>1.4x (Brisk)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Voice Resonance (Pitch)</span>
                  <span className="font-mono text-cyan-400">{voicePitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.85}
                  max={1.15}
                  step={0.05}
                  value={voicePitch}
                  onChange={e => {
                    const p = Number(e.target.value);
                    setVoicePitch(p);
                    localStorage.setItem('zeno_voice_pitch', p.toString());
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Sample Test Voice Button */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    const isKn = selectedLang.startsWith('kn');
                    const isHi = selectedLang.startsWith('hi');
                    const testPhrase = isKn
                      ? "ನಮಸ್ಕಾರ! ನಾನು ಝೆನೋ ಎಐ. ನಿಮ್ಮ ವಾಯ್ಸ್ ಸಿಂಥಸೈಜರ್ ಸಿದ್ಧವಾಗಿದೆ."
                      : isHi
                      ? "नमस्ते! मैं ज़ेनो एआई हूँ। आपका वॉयस सिंथेसाइज़र तैयार है।"
                      : "Hello, I am ZENO AI. Your voice synthesizer is calibrated and ready for real-time conversation.";
                    speakResponse(testPhrase);
                  }}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cyan-300 flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Preview Synthesizer Voice ({currentLangObj.nativeName})</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition"
              >
                Save Calibration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
