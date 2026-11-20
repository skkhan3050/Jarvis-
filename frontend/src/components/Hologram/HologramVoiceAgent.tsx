import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Terminal as TerminalIcon,
  Cpu,
  HardDrive,
  Activity,
  Wifi,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Info,
  Play,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { getBase, authHeaders } from '../../lib/api';

interface LogItem {
  id: string;
  time: string;
  type: 'INFO' | 'WARN' | 'EXEC';
  text: string;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  lang?: 'bn' | 'hi' | 'en';
}

type SupportedLang = 'auto' | 'bn-IN' | 'hi-IN' | 'en-US';

export function HologramVoiceAgent() {
  const selectedModel = useAppStore((s) => s.selectedModel);
  const models = useAppStore((s) => s.models);

  // Voice & Interaction states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0); // 0 to 1
  const [audioLevel, setAudioLevel] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Multilingual Configuration: Auto / Bengali / Hindi / English
  const [voiceInputLang, setVoiceInputLang] = useState<SupportedLang>('auto');
  const [currentDetectedLang, setCurrentDetectedLang] = useState<'bn' | 'hi' | 'en'>('en');

  // Chat messages with multilingual initial greeting
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Hello! I am JARVIS (LISA), your Intelligent System Assistant.\n\nনমস্কার! আপনি আমার সাথে বাংলা, হিন্দি বা ইংরেজিতে কথা বলতে পারেন।\nनमस्ते! आप मुझसे बांग्ला, हिंदी या अंग्रेजी में बात कर सकते हैं।',
      time: '10:15:20',
      lang: 'en',
    },
  ]);
  const [inputText, setInputText] = useState('');

  // Live System stats
  const [stats, setStats] = useState({
    cpu: 23,
    ram: 65,
    disk: 42,
    net: 68,
    speedGhz: '3.2 GHz',
    ramUsed: '10.3 / 15.6 GB',
    diskUsed: '256 / 512 GB',
    netSpeed: '1.2 Gbps',
  });

  // Terminal state
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'jarvis@ai:~$ neofetch',
    '       .---.        OS: Jarvis Cyber-OS Multilingual x86_64',
    '      /     \\       Host: JARVIS Neural Hologram Workstation',
    '     | () () |      Kernel: 6.8.0-ai-multilingual',
    '      \\  _  /       Languages: Bengali (বাংলা), Hindi (हिन्दी), English',
    '       /   \\        Uptime: 4 hours, 12 mins',
    '      /|   |\\       Shell: bash 5.2.21',
    '     (_|   |_)      DE: Cyber-HUD 46 (Hologram Edition)',
    '                    Theme: Yaru-Purple-Neon-Cyan',
    'jarvis@ai:~$ systemctl status multilingual-voice.service',
    '● multilingual-voice.service - Active: running (Bengali, Hindi, English ready)',
    'jarvis@ai:~$ _',
  ]);

  // Real-time logs
  const [logs, setLogs] = useState<LogItem[]>([
    { id: '1', time: '10:15:23', type: 'INFO', text: 'System scan completed' },
    { id: '2', time: '10:15:24', type: 'INFO', text: 'All services are running' },
    { id: '3', time: '10:15:25', type: 'INFO', text: 'Multilingual neural bridge active' },
    { id: '4', time: '10:15:26', type: 'INFO', text: 'Bengali/Hindi speech models ready' },
    { id: '5', time: '10:15:27', type: 'INFO', text: 'Holographic avatar online' },
  ]);

  // Code snippet display
  const [codeSnippet, setCodeSnippet] = useState(`import psutil

def system_health():
    cpu = psutil.cpu_percent()
    ram = psutil.virtual_memory().percent
    disk = psutil.disk_usage('/').percent
    return {"cpu": cpu, "ram": ram, "disk": disk}

if __name__ == "__main__":
    print(system_health())`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechAnimRef = useRef<number | null>(null);

  // Language Detection Helper
  const detectLanguage = (text: string): 'bn' | 'hi' | 'en' => {
    // Bengali unicode block: U+0980 to U+09FF
    if (/[\u0980-\u09FF]/.test(text)) return 'bn';
    // Devanagari / Hindi unicode block: U+0900 to U+097F
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    // Banglish keywords
    if (/\b(kemon|acho|tumi|apni|bhalo|kichu|korcho|koro|korbo|bhai|dada|ami|amar|tomar|kothay|hobe|naam|ki)\b/i.test(text)) {
      return 'bn';
    }
    // Hinglish keywords
    if (/\b(kaise|kya|karo|batao|mujhe|tum|aap|hum|kaha|hain|hai|karoge|karna|shukriya|namaste|mera|naam)\b/i.test(text)) {
      return 'hi';
    }
    return 'en';
  };

  // Pre-load voices in browser
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const load = () => {
        window.speechSynthesis.getVoices();
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Dynamic system metric oscillation (simulating live telemetry)
  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => {
        const nextCpu = Math.max(12, Math.min(88, prev.cpu + Math.floor(Math.random() * 5 - 2)));
        const nextRam = Math.max(50, Math.min(78, prev.ram + Math.floor(Math.random() * 3 - 1)));
        const nextNet = Math.max(30, Math.min(95, prev.net + Math.floor(Math.random() * 7 - 3)));
        return {
          ...prev,
          cpu: nextCpu,
          ram: nextRam,
          net: nextNet,
        };
      });
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Lip-sync / Mouth animation loop when speaking
  useEffect(() => {
    if (isSpeaking) {
      let t = 0;
      const animateMouth = () => {
        t += 0.22;
        const open = Math.sin(t) * 0.45 + Math.sin(t * 2.3) * 0.25 + 0.3;
        const clamped = Math.max(0.08, Math.min(0.92, open));
        setMouthOpen(clamped);
        setAudioLevel(Math.floor(clamped * 100));
        speechAnimRef.current = requestAnimationFrame(animateMouth);
      };
      speechAnimRef.current = requestAnimationFrame(animateMouth);
    } else {
      if (speechAnimRef.current) cancelAnimationFrame(speechAnimRef.current);
      setMouthOpen(0);
      setAudioLevel(0);
    }
    return () => {
      if (speechAnimRef.current) cancelAnimationFrame(speechAnimRef.current);
    };
  }, [isSpeaking]);

  const addLog = (type: 'INFO' | 'WARN' | 'EXEC', text: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [...prev.slice(-15), { id: String(Date.now() + Math.random()), time, type, text }]);
  };

  // Multilingual Web Speech Synthesis (Instant Voice Snippet <50ms)
  const speakText = useCallback((text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {}

    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[*_#`~>•|]/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[^\p{L}\p{N}\p{P}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const sentenceMatch = cleanText.match(/[^.!?।\n]+[.!?।]/g);
    let speechSnippet = '';
    if (sentenceMatch && sentenceMatch.length > 0) {
      speechSnippet = sentenceMatch.slice(0, 2).join(' ').trim();
      if (speechSnippet.length > 180) {
        speechSnippet = speechSnippet.slice(0, 175) + '...';
      }
    } else {
      speechSnippet = cleanText.slice(0, 150) + (cleanText.length > 150 ? '...' : '');
    }

    const detectedLang = detectLanguage(speechSnippet);
    setCurrentDetectedLang(detectedLang);

    const utterance = new SpeechSynthesisUtterance(speechSnippet);
    utterance.rate = 1.08;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    if (detectedLang === 'bn') {
      utterance.lang = 'bn-IN';
      const bnVoice = voices.find(
        (v) =>
          v.lang.startsWith('bn') ||
          v.name.toLowerCase().includes('bengali') ||
          v.name.toLowerCase().includes('bangla') ||
          v.name.toLowerCase().includes('bashkar') ||
          v.name.toLowerCase().includes('tanishaa')
      );
      if (bnVoice) utterance.voice = bnVoice;
    } else if (detectedLang === 'hi') {
      utterance.lang = 'hi-IN';
      const hiVoice = voices.find(
        (v) =>
          v.lang.startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.includes('हिन्दी') ||
          v.name.toLowerCase().includes('swara') ||
          v.name.toLowerCase().includes('kalpana') ||
          v.name.toLowerCase().includes('hemant')
      );
      if (hiVoice) utterance.voice = hiVoice;
    } else {
      utterance.lang = 'en-US';
      const enVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Jenny') ||
            v.name.includes('Zira') ||
            v.name.includes('Aria'))
      );
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      addLog('INFO', `Voice active [${detectedLang.toUpperCase()}] — animating avatar mouth.`);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      addLog('INFO', 'Voice playback complete.');
    };

    utterance.onerror = (e) => {
      console.warn('Speech error', e);
      setIsSpeaking(false);
    };

    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('TTS speak error:', e);
      }
    }, 50);
  }, [ttsEnabled]);

  // Multilingual Web Speech Recognition (Microphone Speech-to-Text)
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Your browser does not support SpeechRecognition. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;

    // Resolve microphone listening language
    let targetLang = 'en-US';
    if (voiceInputLang === 'bn-IN') {
      targetLang = 'bn-IN';
    } else if (voiceInputLang === 'hi-IN') {
      targetLang = 'hi-IN';
    } else if (voiceInputLang === 'en-US') {
      targetLang = 'en-US';
    } else {
      // Auto mode: default to Hindi or Bengali based on locale or user preference
      const navLang = navigator.language || '';
      if (navLang.startsWith('bn')) targetLang = 'bn-IN';
      else if (navLang.startsWith('hi')) targetLang = 'hi-IN';
      else targetLang = 'hi-IN'; // default to Indian subcontinent Hindi for auto voice
    }
    rec.lang = targetLang;

    rec.onstart = () => {
      setIsListening(true);
      addLog('INFO', `Microphone active — listening in [${targetLang}]...`);
    };

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          setInputText(event.results[i][0].transcript);
        }
      }
      if (finalTranscript) {
        setInputText(finalTranscript);
        handleSend(finalTranscript);
      }
    };

    rec.onerror = (e: any) => {
      console.warn('Speech rec error', e);
      setIsListening(false);
      addLog('WARN', `Speech recognition error: ${e.error}`);
    };

    rec.onend = () => {
      setIsListening(false);
      addLog('INFO', 'Voice input ended.');
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Send message to AI Backend with Multilingual Enforcement
  const handleSend = async (manualText?: string) => {
    const textToSend = manualText || inputText;
    if (!textToSend.trim() || isProcessing) return;

    setInputText('');
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    const detected = detectLanguage(textToSend);
    setCurrentDetectedLang(detected);

    const userMsg: MessageItem = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      time: nowTime,
      lang: detected,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    addLog('EXEC', `Query in [${detected.toUpperCase()}]: "${textToSend.slice(0, 30)}..."`);

    try {
      const base = getBase();
      let reply = '';

      // 1. Primary: Master Specialist Orchestrator (Meta Ads, Gmail, Weather, Google Search)
      try {
        const dispatchRes = await fetch(`${base}/v1/master/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ message: textToSend, user_id: 'commander' }),
        });
        if (dispatchRes.ok) {
          const dispatchData = await dispatchRes.json();
          if (dispatchData.handled && (dispatchData.summary || dispatchData.response)) {
            reply = dispatchData.summary || dispatchData.response;
          }
        }
      } catch (dispatchErr) {
        console.warn('Hologram specialist dispatch bypassed:', dispatchErr);
      }

      // 2. Direct LLM completion
      if (!reply) {
        const modelToUse = selectedModel || 'qwen2.5:1.5b';
        const res = await fetch(`${base}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              {
                role: 'system',
                content: `You are JARVIS (also called LISA), an advanced intelligent holographic personal assistant with high technical mastery, cybernetic presence, and friendly helpfulness.

CRITICAL MULTILINGUAL MANDATE:
You must ALWAYS respond in the EXACT SAME LANGUAGE the user addresses you in:
1. If the user writes or speaks in Bengali (বাংলা) or Banglish:
   -> Respond completely in natural, polite Bengali (বাংলা বা বাংলিশ).
2. If the user writes or speaks in Hindi (हिन्दी) or Hinglish:
   -> Respond completely in natural, polite Hindi (हिन्दी या हिंग्लिश).
3. If the user writes or speaks in English:
   -> Respond in fluent English.
Always keep answers helpful, intelligent, polite, and futuristic. Never switch to another language unless explicitly requested.`,
              },
              ...messages.slice(-6).map((m) => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text,
              })),
              { role: 'user', content: textToSend },
            ],
            stream: false,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          reply = data.choices?.[0]?.message?.content || '';
        }
      }

      if (!reply) {
        if (detected === 'bn') {
          reply = '⚠️ ব্যাকএন্ড সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে। অনুগ্রহ করে ব্যাকএন্ড http://127.0.0.1:8000 চালু রয়েছে কিনা পরীক্ষা করুন।';
        } else if (detected === 'hi') {
          reply = '⚠️ बैकएंड सर्वर से संपर्क नहीं हो पा रहा है। कृपया सुनिश्चित करें कि सर्वर पोर्ट 8000 पर सक्रिय है।';
        } else {
          reply = '⚠️ Unable to reach Jarvis backend. Please verify that the server is running on http://127.0.0.1:8000.';
        }
      }

      const codeMatch = reply.match(/```(?:python|bash|javascript|ts)?\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        setCodeSnippet(codeMatch[1].trim());
        addLog('INFO', 'Updated Code Snippet view with generated script.');
      }

      const replyDetectedLang = detectLanguage(reply);
      const botTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      const botMsg: MessageItem = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: reply,
        time: botTime,
        lang: replyDetectedLang,
      };

      setMessages((prev) => [...prev, botMsg]);
      addLog('INFO', `Response generated in [${replyDetectedLang.toUpperCase()}].`);
      speakText(reply);
    } catch (err: any) {
      console.error(err);
      let errMsg = `⚠️ Connection error: ${err?.message || 'Server offline'}. Please restart Jarvis backend on 127.0.0.1:8000.`;
      if (detected === 'bn') errMsg = '⚠️ সংযোগ ত্রুটি: ব্যাকএন্ড সার্ভার পাওয়া যাচ্ছে না।';
      else if (detected === 'hi') errMsg = '⚠️ कनेक्शन त्रुटि: बैकएंड सर्वर अनुपलब्ध है।';

      const botTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: errMsg,
          time: botTime,
          lang: detected,
        },
      ]);
      speakText(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

    const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    addLog('INFO', 'Code snippet copied to clipboard');
  };

  const runShortcut = (action: string) => {
    if (action === 'update') {
      addLog('INFO', 'Running system update check...');
      setTerminalLines((prev) => [
        ...prev,
        'jarvis@ai:~$ sudo apt update && oj-sync',
        '[OK] Hit:1 https://openjarvis.ai/repo stable InRelease',
        '[OK] All 2947 packages are up to date.',
        'jarvis@ai:~$ _',
      ]);
      if (currentDetectedLang === 'bn') {
        speakText('সিস্টেম সম্পূর্ণ আপডেট আছে এবং সমস্ত প্যাকেজ প্রস্তুত।');
      } else if (currentDetectedLang === 'hi') {
        speakText('सिस्टम पूरी तरह अपडेट है और सभी पैकेज चालू हैं।');
      } else {
        speakText('System is fully updated and all packages are current.');
      }
    } else if (action === 'clean') {
      addLog('INFO', 'Cleaning cache and temporary memories...');
      setLogs((prev) => prev.slice(-4));
      if (currentDetectedLang === 'bn') {
        speakText('ক্যাশ এবং মেমরি লগ পরিষ্কার করা হয়েছে।');
      } else if (currentDetectedLang === 'hi') {
        speakText('कैश और मेमोरी साफ कर दी गई है।');
      } else {
        speakText('Cache and memory logs have been purged.');
      }
    } else if (action === 'info') {
      addLog('INFO', 'Displaying system hardware and memory specs...');
      setTerminalLines((prev) => [
        ...prev,
        'jarvis@ai:~$ oj doctor --multilingual',
        'Hardware: Intel Core i7 / 8 Cores / 16 Threads',
        'Memory: 15.6 GB RAM (65% used)',
        'Supported Languages: বাংলা (Bengali), हिन्दी (Hindi), English',
        'Voice Engine: WebSpeech & ElevenLabs Multilingual V2',
        'jarvis@ai:~$ _',
      ]);
      if (currentDetectedLang === 'bn') {
        speakText('এখানে আপনার বিস্তারিত সিস্টেম বিবরণী দেওয়া হলো।');
      } else if (currentDetectedLang === 'hi') {
        speakText('यहाँ आपकी विस्तृत सिस्टम जानकारी है।');
      } else {
        speakText('Here is your detailed system information.');
      }
    } else if (action === 'voice') {
      toggleSpeechRecognition();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#05070d] text-cyan-100 overflow-hidden select-none font-mono">
      {/* Background Cyber City & Scanline Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
        style={{ backgroundImage: `url('/lisa-hologram.jpg')` }}
      />
      <div className="absolute inset-0 bg-radial from-transparent via-[#05070d]/70 to-[#020306] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 240, 255, 0.2) 3px)',
        }}
      />

      {/* Top Holographic Status Bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-2 bg-[#090d18]/80 border-b border-cyan-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
          <span className="text-sm font-bold tracking-widest text-cyan-300">
            JARVIS // MULTILINGUAL HOLOGRAPHIC AI
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
            AI ONLINE
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Multilingual Voice Input Selector */}
          <div className="flex items-center gap-1 bg-black/60 border border-cyan-500/40 rounded-lg p-1 backdrop-blur-sm">
            <span className="flex items-center gap-1 text-[10px] text-gray-400 px-1 font-sans">
              <Globe size={11} className="text-cyan-400" /> MIC LANG:
            </span>
            <button
              onClick={() => setVoiceInputLang('auto')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                voiceInputLang === 'auto'
                  ? 'bg-cyan-500 text-black shadow-[0_0_8px_#00f0ff]'
                  : 'text-gray-400 hover:text-cyan-300'
              }`}
              title="Auto Detect Language"
            >
              Auto
            </button>
            <button
              onClick={() => setVoiceInputLang('bn-IN')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                voiceInputLang === 'bn-IN'
                  ? 'bg-purple-600 text-white shadow-[0_0_8px_#a855f7]'
                  : 'text-gray-400 hover:text-purple-300'
              }`}
              title="Bengali (বাংলা) Voice Input"
            >
              🇧🇩 বাংলা
            </button>
            <button
              onClick={() => setVoiceInputLang('hi-IN')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                voiceInputLang === 'hi-IN'
                  ? 'bg-orange-600 text-white shadow-[0_0_8px_#ea580c]'
                  : 'text-gray-400 hover:text-orange-300'
              }`}
              title="Hindi (हिन्दी) Voice Input"
            >
              🇮🇳 हिन्दी
            </button>
            <button
              onClick={() => setVoiceInputLang('en-US')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                voiceInputLang === 'en-US'
                  ? 'bg-blue-600 text-white shadow-[0_0_8px_#3b82f6]'
                  : 'text-gray-400 hover:text-blue-300'
              }`}
              title="English Voice Input"
            >
              🇬🇧 English
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">MODEL:</span>
            <span className="text-purple-400 font-semibold">{selectedModel || 'qwen2.5:1.5b'}</span>
          </div>

          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
              ttsEnabled
                ? 'bg-purple-950/60 border-purple-500/40 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                : 'bg-gray-900 border-gray-700 text-gray-500'
            }`}
            title="Toggle Voice Speech Output"
          >
            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{ttsEnabled ? 'VOICE ON' : 'MUTED'}</span>
          </button>
        </div>
      </div>

      {/* Main HUD 3-Column Layout */}
      <div className="relative z-10 grid grid-cols-12 gap-3 p-3 h-[calc(100%-42px)] overflow-hidden">
        {/* ================= LEFT COLUMN: GAUGES, TERMINAL, LOGS ================= */}
        <div className="col-span-3 flex flex-col gap-3 h-full overflow-hidden">
          {/* SYSTEM OVERVIEW GAUGES */}
          <div className="bg-[#0b1020]/80 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm shadow-[0_0_15px_rgba(0,240,255,0.07)]">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold mb-2.5 border-b border-cyan-500/20 pb-1">
              <span className="flex items-center gap-1.5">
                <Cpu size={14} /> SYSTEM OVERVIEW
              </span>
              <span className="text-[10px] text-cyan-600">LIVE GAUGES</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {/* CPU Gauge */}
              <div className="flex flex-col items-center">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-11 h-11 -rotate-90">
                    <circle cx="22" cy="22" r="18" stroke="rgba(0,240,255,0.15)" strokeWidth="3" fill="none" />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="#00f0ff"
                      strokeWidth="3.5"
                      strokeDasharray="113.1"
                      strokeDashoffset={113.1 - (113.1 * stats.cpu) / 100}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-cyan-200">{stats.cpu}%</span>
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5">CPU</span>
                <span className="text-[8px] text-cyan-500">{stats.speedGhz}</span>
              </div>

              {/* RAM Gauge */}
              <div className="flex flex-col items-center">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-11 h-11 -rotate-90">
                    <circle cx="22" cy="22" r="18" stroke="rgba(168,85,247,0.15)" strokeWidth="3" fill="none" />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="#c084fc"
                      strokeWidth="3.5"
                      strokeDasharray="113.1"
                      strokeDashoffset={113.1 - (113.1 * stats.ram) / 100}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-purple-200">{stats.ram}%</span>
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5">RAM</span>
                <span className="text-[8px] text-purple-400">10.3GB</span>
              </div>

              {/* DISK Gauge */}
              <div className="flex flex-col items-center">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-11 h-11 -rotate-90">
                    <circle cx="22" cy="22" r="18" stroke="rgba(0,240,255,0.15)" strokeWidth="3" fill="none" />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="#00f0ff"
                      strokeWidth="3.5"
                      strokeDasharray="113.1"
                      strokeDashoffset={113.1 - (113.1 * stats.disk) / 100}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-cyan-200">{stats.disk}%</span>
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5">DISK</span>
                <span className="text-[8px] text-cyan-500">256GB</span>
              </div>

              {/* NET Gauge */}
              <div className="flex flex-col items-center">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-11 h-11 -rotate-90">
                    <circle cx="22" cy="22" r="18" stroke="rgba(168,85,247,0.15)" strokeWidth="3" fill="none" />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="#c084fc"
                      strokeWidth="3.5"
                      strokeDasharray="113.1"
                      strokeDashoffset={113.1 - (113.1 * stats.net) / 100}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-purple-200">{stats.net}%</span>
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5">NET</span>
                <span className="text-[8px] text-purple-400">1.2G</span>
              </div>
            </div>
          </div>

          {/* TERMINAL PANEL */}
          <div className="flex-1 bg-[#070b16]/90 border border-cyan-500/30 rounded-lg p-3 flex flex-col min-h-0 backdrop-blur-sm shadow-[0_0_15px_rgba(0,240,255,0.05)]">
            <div className="flex items-center justify-between text-xs text-cyan-400 mb-2 border-b border-cyan-500/20 pb-1">
              <span className="flex items-center gap-1.5 font-bold">
                <TerminalIcon size={14} /> TERMINAL
              </span>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500/70" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                <span className="w-2 h-2 rounded-full bg-green-500/70" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto text-[10px] text-cyan-300 font-mono space-y-0.5 pr-1 leading-relaxed">
              {terminalLines.map((line, idx) => (
                <div key={idx} className={line.startsWith('jarvis@') ? 'text-purple-300 font-bold' : 'text-cyan-400/80'}>
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* REAL-TIME LOGS PANEL */}
          <div className="h-32 bg-[#070b16]/90 border border-cyan-500/30 rounded-lg p-3 flex flex-col backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-cyan-400 mb-2 border-b border-cyan-500/20 pb-1 font-bold">
              <span>REAL-TIME LOGS</span>
              <span className="text-[10px] text-cyan-600 font-normal">STREAMING</span>
            </div>

            <div className="flex-1 overflow-y-auto text-[10px] space-y-1 font-mono">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-2">
                  <span className="text-gray-500 text-[9px]">{log.time}</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                      log.type === 'INFO'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                        : log.type === 'WARN'
                        ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                        : 'bg-purple-950 text-purple-400 border border-purple-500/30'
                    }`}
                  >
                    [{log.type}]
                  </span>
                  <span className="text-gray-300 truncate">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= CENTER COLUMN: HOLOGRAPHIC AVATAR ================= */}
        <div className="col-span-5 relative flex flex-col items-center justify-between h-full py-2 overflow-hidden">
          {/* Avatar Holographic Display Area */}
          <div className="relative w-full flex-1 flex flex-col items-center justify-center">
            {/* Holographic Glowing Beam Rings */}
            <div
              className={`absolute w-72 h-72 rounded-full border border-cyan-400/20 transition-all duration-700 ${
                isSpeaking
                  ? 'scale-110 border-cyan-400/50 shadow-[0_0_50px_rgba(0,240,255,0.4)] animate-pulse'
                  : isListening
                  ? 'scale-105 border-green-400/50 shadow-[0_0_40px_rgba(74,222,128,0.3)] animate-ping'
                  : 'shadow-[0_0_30px_rgba(0,240,255,0.15)]'
              }`}
            />

            {/* Avatar Image Frame */}
            <div className="relative w-64 h-84 flex items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 via-[#0a1024]/70 to-[#020306]">
              {/* The Holographic Avatar Photo */}
              <img
                src="/lisa-hologram.jpg"
                alt="JARVIS LISA Hologram"
                className={`w-full h-full object-cover object-top filter brightness-110 contrast-110 transition-transform duration-500 ${
                  isSpeaking ? 'scale-102' : 'scale-100'
                }`}
                style={{
                  maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                }}
              />

              {/* Dynamic Lip-Sync Mouth Mesh Overlay */}
              <div
                className="absolute"
                style={{
                  top: '38.5%',
                  left: '49.8%',
                  transform: 'translate(-50%, -50%)',
                  width: '32px',
                  height: '18px',
                  pointerEvents: 'none',
                }}
              >
                {/* Reactive Mouth Aperture */}
                <svg viewBox="0 0 40 24" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="mouthGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ff77a8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#4a154b" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>

                  {/* Outer Lip Contour */}
                  <path
                    d={`M 6,12 Q 20,${12 - mouthOpen * 4} 34,12 Q 20,${12 + mouthOpen * 8} 6,12`}
                    fill="url(#mouthGlow)"
                    opacity={isSpeaking ? 0.9 : 0.2}
                    className="transition-all duration-75"
                  />

                  {/* Inner Mouth Opening */}
                  {isSpeaking && mouthOpen > 0.15 && (
                    <ellipse
                      cx="20"
                      cy="12"
                      rx={8 + mouthOpen * 4}
                      ry={2 + mouthOpen * 5}
                      fill="#1f071f"
                      stroke="#ff99c8"
                      strokeWidth="0.8"
                    />
                  )}

                  {/* Teeth highlight */}
                  {isSpeaking && mouthOpen > 0.3 && (
                    <path
                      d="M 14,10.5 Q 20,11.5 26,10.5"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                  )}
                </svg>
              </div>

              {/* Holographic Chest Title "JARVIS" */}
              <div className="absolute top-[52%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <span className="text-xl font-black tracking-widest text-cyan-200 drop-shadow-[0_0_12px_#00f0ff]">
                  JARVIS
                </span>
              </div>

              {/* Hologram Scanlines Overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(180deg, transparent, transparent 3px, rgba(0, 240, 255, 0.4) 4px)',
                }}
              />
            </div>

            {/* Futuristic Holographic Pedestal with Audio Wave */}
            <div className="relative mt-2 flex flex-col items-center">
              {/* Circular Hologram Base */}
              <div className="relative w-52 h-7 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 bg-[#061026] shadow-[0_0_20px_#00f0ff]" />
                <div className="absolute w-44 h-5 rounded-full border border-purple-400/40 bg-cyan-950/40 animate-pulse" />

                {/* Animated Audio Equalizer Bars */}
                <div className="relative z-10 flex items-center gap-1">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                      style={{
                        height: isSpeaking
                          ? `${Math.max(4, Math.sin(i * 0.8 + audioLevel) * 16 + 8)}px`
                          : isListening
                          ? `${Math.max(4, Math.sin(i * 1.2) * 12 + 6)}px`
                          : '4px',
                        boxShadow: '0 0 6px #00f0ff',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Status Badge with Active Language Flag */}
              <div className="mt-2 flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#0a1228] border border-cyan-500/40 text-[11px] font-bold text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSpeaking
                      ? 'bg-purple-400 animate-ping'
                      : isListening
                      ? 'bg-green-400 animate-ping'
                      : isProcessing
                      ? 'bg-yellow-400 animate-spin'
                      : 'bg-cyan-400'
                  }`}
                />
                <span>
                  {isSpeaking
                    ? `SPEAKING [${currentDetectedLang.toUpperCase()}] // AUDIO ACTIVE`
                    : isListening
                    ? `LISTENING [${voiceInputLang.replace('-IN', '').replace('-US', '')}] // VOICE IN`
                    : isProcessing
                    ? 'PROCESSING // NEURAL THINKING'
                    : 'STANDBY // SYSTEM READY'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: CHAT, CODE, SHORTCUTS, MONITOR ================= */}
        <div className="col-span-4 flex flex-col gap-3 h-full overflow-hidden">
          {/* AI CHAT INTERFACE WINDOW */}
          <div className="flex-1 bg-[#0b1020]/90 border border-cyan-500/30 rounded-lg flex flex-col min-h-0 backdrop-blur-sm shadow-[0_0_15px_rgba(0,240,255,0.06)]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/20 text-xs text-cyan-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} /> AI CHAT INTERFACE
              </span>
              <div className="flex gap-1.5 text-gray-500 text-[10px]">
                <span>—</span>
                <span>□</span>
                <span>✕</span>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-2.5 leading-relaxed text-xs whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-purple-900/60 border border-purple-500/40 text-purple-100'
                        : 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-100 shadow-[0_0_8px_rgba(0,240,255,0.1)]'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-gray-500">
                    <span>{m.time}</span>
                    {m.lang && (
                      <span className="px-1 rounded bg-black/40 text-cyan-400 border border-cyan-500/20">
                        {m.lang === 'bn' ? 'বাংলা' : m.lang === 'hi' ? 'हिन्दी' : 'ENG'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 animate-pulse">
                  <Sparkles size={12} /> JARVIS is thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Multilingual Quick Prompts */}
            <div className="px-3 py-1 flex items-center gap-1.5 overflow-x-auto text-[10px] text-cyan-400/80 border-t border-cyan-500/10">
              <button
                onClick={() => handleSend('সিস্টেম অপ্টিমাইজ করো এবং স্ট্যাটাস বলো')}
                className="whitespace-nowrap px-2 py-0.5 rounded bg-purple-950/50 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-colors"
                title="Bengali Prompt"
              >
                &gt; বাংলা: সিস্টেম অপ্টিমাইজ
              </button>
              <button
                onClick={() => handleSend('सिस्टम का हेल्थ चेक करो और बताओ सब कैसा है')}
                className="whitespace-nowrap px-2 py-0.5 rounded bg-orange-950/50 hover:bg-orange-900 border border-orange-500/30 text-orange-300 transition-colors"
                title="Hindi Prompt"
              >
                &gt; हिंदी: सिस्टम हेल्थ
              </button>
              <button
                onClick={() => handleSend('Search the web for latest AI news')}
                className="whitespace-nowrap px-2 py-0.5 rounded bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-500/20 text-cyan-300 transition-colors"
                title="English Prompt"
              >
                &gt; Eng: Search web
              </button>
            </div>

            {/* Chat Input & Mic Area */}
            <div className="p-2 border-t border-cyan-500/20 flex items-center gap-1.5 bg-[#070b16]">
              <button
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-lg border transition-all ${
                  isListening
                    ? 'bg-green-600 border-green-400 text-white animate-pulse shadow-[0_0_10px_#22c55e]'
                    : 'bg-cyan-950 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900'
                }`}
                title={
                  isListening
                    ? `Listening in [${voiceInputLang}] (Click to stop)`
                    : `Click to Speak in ${
                        voiceInputLang === 'bn-IN'
                          ? 'Bengali (বাংলা)'
                          : voiceInputLang === 'hi-IN'
                          ? 'Hindi (हिन्दी)'
                          : voiceInputLang === 'en-US'
                          ? 'English'
                          : 'Auto language'
                      }`
                }
              >
                {isListening ? <Mic size={15} /> : <MicOff size={15} />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={
                  isListening
                    ? `Listening in ${
                        voiceInputLang === 'bn-IN'
                          ? 'বাংলা'
                          : voiceInputLang === 'hi-IN'
                          ? 'हिन्दी'
                          : 'English'
                      }...`
                    : 'Ask JARVIS in বাংলা, हिन्दी or English...'
                }
                className="flex-1 bg-black/50 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />

              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isProcessing}
                className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-600 text-white transition-all shadow-[0_0_8px_#00f0ff]"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* CODE SNIPPET WIDGET */}
          <div className="h-36 bg-[#070b16]/90 border border-cyan-500/30 rounded-lg p-2.5 flex flex-col backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-bold mb-1 border-b border-cyan-500/20 pb-1">
              <span>CODE SNIPPET</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[10px] text-cyan-300 hover:text-cyan-100"
              >
                {copiedCode ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="flex-1 overflow-x-auto text-[10px] text-purple-200 font-mono p-1 bg-black/40 rounded border border-purple-500/20">
              <code>{codeSnippet}</code>
            </pre>
          </div>

          {/* SHORTCUTS PANEL */}
          <div className="bg-[#0b1020]/90 border border-cyan-500/30 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="text-xs text-cyan-400 font-bold mb-2 border-b border-cyan-500/20 pb-1">
              SHORTCUTS
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => runShortcut('update')}
                className="flex flex-col items-center justify-center p-2 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 transition-all text-center group"
              >
                <RefreshCw size={15} className="text-cyan-400 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[9px] text-cyan-300 mt-1">Update System</span>
              </button>

              <button
                onClick={() => runShortcut('clean')}
                className="flex flex-col items-center justify-center p-2 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 transition-all text-center group"
              >
                <Trash2 size={15} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] text-cyan-300 mt-1">Clean Cache</span>
              </button>

              <button
                onClick={() => runShortcut('info')}
                className="flex flex-col items-center justify-center p-2 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 transition-all text-center group"
              >
                <Info size={15} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] text-cyan-300 mt-1">System Info</span>
              </button>

              <button
                onClick={() => runShortcut('voice')}
                className={`flex flex-col items-center justify-center p-2 rounded border transition-all text-center group ${
                  isListening
                    ? 'bg-green-950 border-green-500 text-green-300 animate-pulse'
                    : 'bg-purple-950/60 hover:bg-purple-900 border-purple-500/30 text-purple-300'
                }`}
              >
                <Mic size={15} className="group-hover:scale-110 transition-transform" />
                <span className="text-[9px] mt-1">{isListening ? 'Listening' : 'Smart Voice'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
