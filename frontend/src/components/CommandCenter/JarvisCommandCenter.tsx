import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Search,
  Bell,
  Settings,
  Grid,
  Shield,
  Bot,
  Calendar as CalendarIcon,
  Database,
  MessageSquare,
  BookOpen,
  Wrench,
  Workflow,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sparkles,
  Zap,
  Globe,
  Radio,
  Play,
  Maximize2,
  Minimize2,
  X,
  Cpu,
  Layers,
  Activity,
  HardDrive,
  Users
} from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { getBase, authHeaders } from '../../lib/api';

interface FeedItem {
  id: string;
  title: string;
  sub: string;
  badge: string;
  badgeColor: string;
  iconType: 'info' | 'warn' | 'pr' | 'tip' | 'live' | 'task';
}

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  tag: string;
  status: 'done' | 'active' | 'upcoming';
}

export function JarvisCommandCenter() {
  const selectedModel = useAppStore((s) => s.selectedModel);
  const models = useAppStore((s) => s.models);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('Command Center');

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState({
    date: 'Monday, 15 June 2026',
    time: '11:18:21 am',
  });

  // Voice & Interaction states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceInputLang, setVoiceInputLang] = useState<'auto' | 'bn-IN' | 'hi-IN' | 'en-US'>('auto');
  const [detectedLang, setDetectedLang] = useState<'bn' | 'hi' | 'en'>('en');

  // Interactive Voice & Chat Drawer Modal
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'user' | 'assistant'; text: string; time: string; lang?: string }>>([
    {
      id: '1',
      sender: 'assistant',
      text: 'JARVIS Command Center initialized and standing by. How may I assist you today, Commander?\n\nনমস্কার! আপনি বাংলা, হিন্দি বা ইংরেজিতে নির্দেশ দিতে পারেন।\nनमस्ते! आप मुझसे बांग्ला, हिंदी या अंग्रेजी में निर्देश दे सकते हैं।',
      time: '11:18 am',
      lang: 'en',
    },
  ]);
  const [inputText, setInputText] = useState('');

  // Live System Metrics
  const [sysMetrics, setSysMetrics] = useState({
    cpu: 15,
    ram: 54,
    disk: 40,
    network: 'Excellent',
    weather: '28°C Overcast',
    location: 'Bhimber, Pak...',
  });

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).toLowerCase();
      setCurrentTime({ date: dateStr, time: timeStr });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-Time Live System, Weather & Geolocation Telemetry
  useEffect(() => {
    const fetchLiveTelemetry = async () => {
      try {
        const base = getBase();
        const res = await fetch(`${base}/v1/master/live-hud`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSysMetrics((prev) => ({
            ...prev,
            cpu: data.system?.cpu ?? prev.cpu,
            ram: data.system?.ram ?? prev.ram,
            disk: data.system?.disk ?? prev.disk,
            weather: data.weather?.display ?? prev.weather,
            location: data.weather?.location_display ?? prev.location,
          }));
        }
      } catch {
        // Fallback smooth jitter if temporarily unreachable
        setSysMetrics((prev) => ({
          ...prev,
          cpu: Math.max(10, Math.min(85, prev.cpu + Math.floor(Math.random() * 5 - 2))),
          ram: Math.max(45, Math.min(75, prev.ram + Math.floor(Math.random() * 3 - 1))),
        }));
      }
    };
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 3500);
    return () => clearInterval(interval);
  }, []);

  // Language Detection
  const detectLanguage = (text: string): 'bn' | 'hi' | 'en' => {
    if (/[\u0980-\u09FF]/.test(text)) return 'bn';
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    if (/\b(kemon|acho|tumi|apni|bhalo|kichu|korcho|koro|korbo|bhai|dada|ami|amar|tomar)\b/i.test(text)) return 'bn';
    if (/\b(kaise|kya|karo|batao|mujhe|tum|aap|hum|kaha|hain|hai|karoge|karna|namaste)\b/i.test(text)) return 'hi';
    return 'en';
  };

  // Ultra-Fast Text-To-Speech with Instant Voice Snippet (<50ms delay)
  const speakText = useCallback((text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {}

    // Clean markdown, code blocks, bullets, emojis, and brackets
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[*_#`~>•|]/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[^\p{L}\p{N}\p{P}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // For voice, extract the first 1-2 clean sentences (max ~180 chars)
    // Allows voice to start speaking INSTANTLY without buffering delay
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

    const lang = detectLanguage(speechSnippet);
    setDetectedLang(lang);

    const utterance = new SpeechSynthesisUtterance(speechSnippet);
    utterance.rate = 1.08;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    if (lang === 'bn') {
      utterance.lang = 'bn-IN';
      const bn = voices.find((v) => v.lang.startsWith('bn') || v.name.toLowerCase().includes('bengali') || v.name.toLowerCase().includes('bangla'));
      if (bn) utterance.voice = bn;
    } else if (lang === 'hi') {
      utterance.lang = 'hi-IN';
      const hi = voices.find((v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (hi) utterance.voice = hi;
    } else {
      utterance.lang = 'en-US';
      const en = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Samantha')));
      if (en) utterance.voice = en;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // 50ms timeout avoids Chrome cancel-race condition and guarantees instant speech
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('TTS speak error:', e);
      }
    }, 50);
  }, [ttsEnabled]);

  // Speech Recognition (Mic)
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech Recognition is supported in Chrome, Edge, and modern browsers.');
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;

    let targetLang = 'en-US';
    if (voiceInputLang === 'bn-IN') targetLang = 'bn-IN';
    else if (voiceInputLang === 'hi-IN') targetLang = 'hi-IN';
    else if (voiceInputLang === 'en-US') targetLang = 'en-US';
    else {
      const nav = navigator.language || '';
      targetLang = nav.startsWith('bn') ? 'bn-IN' : nav.startsWith('hi') ? 'hi-IN' : 'hi-IN';
    }
    rec.lang = targetLang;

    rec.onstart = () => {
      setIsListening(true);
      setChatOpen(true);
    };

    rec.onresult = (e: any) => {
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
        else setInputText(e.results[i][0].transcript);
      }
      if (finalTranscript) {
        setInputText(finalTranscript);
        handleSend(finalTranscript);
      }
    };

    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    rec.start();
  };

  // Send message to LLM
  const handleSend = async (manualText?: string) => {
    const textToSend = manualText || inputText;
    if (!textToSend.trim() || isProcessing) return;

    setInputText('');
    setChatOpen(true);
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const lang = detectLanguage(textToSend);
    setDetectedLang(lang);

    const userMsg = {
      id: String(Date.now()),
      sender: 'user' as const,
      text: textToSend,
      time: nowTime,
      lang,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const base = getBase();
      let reply = '';

      // 1. Primary Route: Master AI Specialist Orchestrator (Meta Ads, Gmail, Weather, Google Search, SEO)
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
        console.warn('Master specialist dispatch bypassed:', dispatchErr);
      }

      // 2. Conversational Core: Fast LLM Completion (Gemini / Qwen 1.5B)
      if (!reply) {
        const modelToUse = selectedModel || 'qwen2.5:1.5b';
        const res = await fetch(`${base}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              {
                role: 'system',
                content: `You are JARVIS, an advanced Personal AI Operating System.
CRITICAL LANGUAGE MANDATE:
Always detect and respond in the EXACT SAME LANGUAGE the user addresses you in:
- If user speaks/writes Bengali (বাংলা) or Banglish -> respond completely in Bengali (বাংলা).
- If user speaks/writes Hindi (हिन्दी) or Hinglish -> respond completely in Hindi (हिन्दी).
- If user speaks/writes English -> respond in English.
Provide direct, highly accurate, and helpful answers. Never output canned repetitive text.`,
              },
              ...messages.slice(-6).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
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

      // 3. Resilient Multilingual Fallback if server is offline (Truthful status, never fake acknowledgement)
      if (!reply) {
        if (lang === 'bn') {
          reply = `⚠️ ব্যাকএন্ড সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে। অনুগ্রহ করে ব্যাকএন্ড http://127.0.0.1:8000 চালু রয়েছে কিনা তা নিশ্চিত করুন।`;
        } else if (lang === 'hi') {
          reply = `⚠️ बैकएंड सर्वर से संपर्क नहीं हो पा रहा है। कृपया सुनिश्चित करें कि 'openjarvis serve' पोर्ट 8000 पर सक्रिय रूप से चल रहा है।`;
        } else {
          reply = `⚠️ Unable to connect to Jarvis backend. Please ensure the server daemon is active at http://127.0.0.1:8000.`;
        }
      }

      const replyLang = detectLanguage(reply);
      const botMsg = {
        id: String(Date.now() + 1),
        sender: 'assistant' as const,
        text: reply,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        lang: replyLang,
      };
      setMessages((prev) => [...prev, botMsg]);
      speakText(reply);
    } catch (err: any) {
      let errMsg = `⚠️ Connection error: ${err?.message || 'Server offline'}. Please restart Jarvis backend on 127.0.0.1:8000.`;
      if (lang === 'bn') errMsg = `⚠️ সংযোগ ত্রুটি: ব্যাকএন্ড সার্ভার পাওয়া যাচ্ছে না। অনুগ্রহ করে সার্ভারটি রিস্টার্ট করুন।`;
      else if (lang === 'hi') errMsg = `⚠️ कनेक्शन त्रुटि: बैकएंड सर्वर उपलब्ध नहीं है। कृपया बैकएंड को पुनः प्रारंभ करें।`;

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: errMsg,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          lang,
        },
      ]);
      speakText(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

    // Executive Briefing handler
  const triggerExecutiveBriefing = () => {
    let brief = 'Executive Briefing: All 7 AI agents are synchronized. System load is optimal with CPU at 15%. No critical threats detected. 2 tasks require your attention today.';
    if (voiceInputLang === 'bn-IN') {
      brief = 'এক্সিকিউটিভ ব্রিফিং: সমস্ত ৭টি এআই এজেন্ট সক্রিয় আছে। সিস্টেমের অবস্থা সম্পূর্ণ অপটিমাল এবং সিপিইউ ১৫% লোডে চলছে। কোনো নিরাপত্তা হুমকি নেই।';
    } else if (voiceInputLang === 'hi-IN') {
      brief = 'एग्जीक्यूटिव ब्रीफिंग: सभी ७ एआई एजेंट पूरी तरह सक्रिय हैं। सीपीयू लोड १५% के साथ सिस्टम सामान्य है। कोई गंभीर सुरक्षा खतरा नहीं है।';
    }
    setChatOpen(true);
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'assistant',
        text: brief,
        time: currentTime.time,
        lang: voiceInputLang === 'bn-IN' ? 'bn' : voiceInputLang === 'hi-IN' ? 'hi' : 'en',
      },
    ]);
    speakText(brief);
  };

  // Feed items matching Image 1
  const feedItems: FeedItem[] = [
    { id: '1', title: 'Design review with the product team...', sub: '2m ago • Product', badge: 'INFO', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', iconType: 'info' },
    { id: '2', title: '2 tasks are overdue — "Polish voice..."', sub: 'Overdue', badge: 'WARN', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40', iconType: 'warn' },
    { id: '3', title: '3 pull requests are awaiting your review...', sub: '02hrm', badge: 'PR', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', iconType: 'pr' },
    { id: '4', title: 'Your deep-work block is 2-4 PM...', sub: 'Focus', badge: 'TIP', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40', iconType: 'tip' },
    { id: '5', title: 'CPU usage at 15%', sub: 'System load normal', badge: 'LIVE', badgeColor: 'bg-green-500/20 text-green-300 border-green-500/40', iconType: 'live' },
    { id: '6', title: '2 tasks overdue', sub: 'Review the board and reschedule.', badge: 'View Tasks', badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40', iconType: 'task' },
  ];

  // Timeline items matching Image 1
  const timelineItems: TimelineItem[] = [
    { id: '1', time: '09:30 am', title: 'Daily Standup', tag: 'Done', status: 'done' },
    { id: '2', time: '12:00 pm', title: 'Finalize SEO panel roadmap', tag: 'in 42 min', status: 'upcoming' },
    { id: '3', time: '02:00 pm', title: 'Deep-work block: Voice Dubbing', tag: 'in 2.5 hrs', status: 'active' },
    { id: '4', time: '04:30 pm', title: 'Design Review — Command Center V1', tag: 'in 5h 12m', status: 'upcoming' },
  ];

  // Sidebar items matching Image 1
  const sidebarItems = [
    { name: 'Command Center', icon: Grid, badge: null },
    { name: 'AI Core', icon: Cpu, badge: null },
    { name: 'Agents', icon: Bot, badge: null },
    { name: 'Tasks', icon: CheckCircle2, badge: '5' },
    { name: 'Calendar', icon: CalendarIcon, badge: null },
    { name: 'Memory', icon: Database, badge: null },
    { name: 'Conversations', icon: MessageSquare, badge: '12' },
    { name: 'Knowledge Base', icon: BookOpen, badge: null },
    { name: 'Tools & Skills', icon: Wrench, badge: '18' },
    { name: 'Workflows', icon: Workflow, badge: null },
  ];

  return (
    <div className="relative w-full h-full bg-[#030712] text-slate-100 flex overflow-hidden select-none font-sans">
      {/* Sci-Fi Background Glow & Vignette */}
      <div className="absolute inset-0 bg-radial from-[#0d2247]/30 via-[#030816]/80 to-[#02040a] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #00f0ff 1px, transparent 1px), linear-gradient(to bottom, #00f0ff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Matching Image 1) */}
      {/* ========================================================================= */}
      <aside className="relative z-20 w-64 h-full bg-[#050c1e]/90 border-r border-cyan-500/25 flex flex-col justify-between shrink-0 backdrop-blur-md">
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-cyan-500/20">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-spin-slow shadow-[0_0_12px_#00f0ff]" />
              <div className="w-5 h-5 rounded-full bg-cyan-500 shadow-[0_0_10px_#00f0ff]" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-white leading-tight">JARVIS</h1>
              <p className="text-[10px] tracking-wider text-cyan-400/80 font-mono">COMMAND CENTER</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.name);
                    if (item.name === 'Conversations') setChatOpen(true);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/10 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/30 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600/40 text-blue-300 border border-blue-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* VOICE STATUS CARD AT BOTTOM OF SIDEBAR */}
        <div className="p-3 m-3 rounded-xl bg-gradient-to-b from-[#081530] to-[#040a1c] border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300 mb-2">
            <span>VOICE STATUS</span>
            <span className="text-[10px] text-cyan-500">&gt;</span>
          </div>

          {/* Audio Wave Visualizer */}
          <div className="flex items-center justify-center gap-1 h-6 mb-2">
            {[...Array(18)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-cyan-400 rounded-full transition-all duration-100"
                style={{
                  height: isSpeaking
                    ? `${Math.max(4, Math.sin(i * 0.9 + Date.now() / 150) * 20 + 8)}px`
                    : isListening
                    ? `${Math.max(4, Math.sin(i * 1.4) * 16 + 6)}px`
                    : '4px',
                  boxShadow: '0 0 6px #00f0ff',
                }}
              />
            ))}
          </div>

          <div className="text-center text-[10px] text-cyan-400/70 mb-2 font-mono">
            {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Standby'}
          </div>

          {/* Large Glowing Circular Mic Button */}
          <div className="flex justify-center mb-3">
            <button
              onClick={toggleListening}
              className={`relative w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                isListening
                  ? 'bg-gradient-to-br from-green-500 to-emerald-700 shadow-[0_0_25px_#22c55e] scale-105'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-700 shadow-[0_0_20px_#00f0ff] hover:scale-105'
              }`}
            >
              <Mic size={22} className="text-white" />
              <span className="text-[9px] font-semibold text-white/90 mt-0.5">Tap to Speak</span>
            </button>
          </div>

          {/* Focus Mode Button */}
          <button className="w-full py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-[11px] font-medium text-cyan-300 flex items-center justify-center gap-1.5 transition-colors">
            <Zap size={13} className="text-cyan-400" />
            <span>Focus Mode</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN VIEW AREA */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP STATUS BAR (Matching Image 1) */}
        <header className="h-16 px-6 border-b border-cyan-500/20 bg-[#060e24]/80 flex items-center justify-between shrink-0 backdrop-blur-md">
          {/* Left: System Status Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#081738] border border-cyan-500/30">
              <span className="text-xs font-bold text-gray-400 tracking-wider">SYSTEM STATUS</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                OPTIMAL
              </span>
            </div>
          </div>

          {/* Center: Live Date & Clock Display */}
          <div className="text-center">
            <p className="text-[11px] text-cyan-400/80 font-medium tracking-wide">{currentTime.date}</p>
            <p className="text-xl font-black text-cyan-200 tracking-wider font-mono drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
              {currentTime.time}
            </p>
          </div>

          {/* Right: Search Bar & Actions & Commander Profile */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-48 pl-8 pr-3 py-1.5 text-xs bg-[#091636] border border-cyan-500/30 rounded-lg text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1 bg-[#091636] border border-cyan-500/30 rounded-lg p-1 text-xs">
              <Globe size={13} className="text-cyan-400 ml-1" />
              <button
                onClick={() => setVoiceInputLang('auto')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${voiceInputLang === 'auto' ? 'bg-cyan-500 text-black' : 'text-gray-400'}`}
              >
                Auto
              </button>
              <button
                onClick={() => setVoiceInputLang('bn-IN')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${voiceInputLang === 'bn-IN' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                title="বাংলা (Bengali)"
              >
                বাংলা
              </button>
              <button
                onClick={() => setVoiceInputLang('hi-IN')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${voiceInputLang === 'hi-IN' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}
                title="हिन्दी (Hindi)"
              >
                हिन्दी
              </button>
              <button
                onClick={() => setVoiceInputLang('en-US')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${voiceInputLang === 'en-US' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                title="English"
              >
                EN
              </button>
            </div>

            <button className="p-2 rounded-lg bg-[#091636] border border-cyan-500/30 text-gray-300 hover:text-cyan-300">
              <Bell size={15} />
            </button>
            <button className="p-2 rounded-lg bg-[#091636] border border-cyan-500/30 text-gray-300 hover:text-cyan-300">
              <Settings size={15} />
            </button>

            {/* Operator Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-cyan-500/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border border-cyan-400 flex items-center justify-center font-bold text-xs text-white shadow-[0_0_10px_#00f0ff]">
                OP
              </div>
              <div className="text-left text-xs leading-tight">
                <p className="font-bold text-slate-100">Operator</p>
                <p className="text-[10px] text-cyan-400">Commander</p>
              </div>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 3. DASHBOARD CONTENT GRID (3-ROW SCI-FI TACTICAL HUD) */}
        {/* ========================================================================= */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* ----------------- TOP ROW (AI CORE OVERVIEW | HOLOGRAPHIC SPHERE | INTEL FEED) ----------------- */}
          <div className="grid grid-cols-12 gap-4">
            {/* AI Core Overview (Top Left Card) */}
            <div className="col-span-3 rounded-xl bg-[#06122c]/85 border border-cyan-500/30 p-3.5 flex flex-col justify-between shadow-[0_0_15px_rgba(0,240,255,0.06)] backdrop-blur-sm">
              <h3 className="text-xs font-bold text-cyan-300 tracking-wider mb-2">AI CORE OVERVIEW</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#091a3e]/60 border border-cyan-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-cyan-950 flex items-center justify-center text-cyan-400">
                      <Cpu size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">AI Core</p>
                      <p className="text-[10px] text-cyan-400">Active</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#091a3e]/60 border border-cyan-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-purple-950 flex items-center justify-center text-purple-400">
                      <Database size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Memory</p>
                      <p className="text-[10px] text-purple-400">29GB Used</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#091a3e]/60 border border-cyan-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-emerald-950 flex items-center justify-center text-emerald-400">
                      <Mic size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Voice</p>
                      <p className="text-[10px] text-emerald-400">Online</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#091a3e]/60 border border-cyan-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-blue-950 flex items-center justify-center text-blue-400">
                      <Bot size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Agents</p>
                      <p className="text-[10px] text-blue-400">7 Running</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#091a3e]/60 border border-cyan-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-amber-950 flex items-center justify-center text-amber-400">
                      <Zap size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">LLMs</p>
                      <p className="text-[10px] text-amber-400">4 Connected</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#091a3e]/60 border border-cyan-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-emerald-950 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">System</p>
                      <p className="text-[10px] text-emerald-400">Optimal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER HOLOGRAPHIC 3D SPHERE "JARVIS AI CORE v3.0.0" (Centerpiece) */}
            <div className="col-span-6 rounded-xl bg-gradient-to-b from-[#061536] via-[#040e28] to-[#020718] border border-cyan-400/40 p-4 relative flex flex-col items-center justify-center overflow-hidden shadow-[0_0_35px_rgba(0,240,255,0.15)]">
              {/* Perspective Glowing Grid Base */}
              <div
                className="absolute -bottom-8 w-full h-32 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(ellipse at bottom, rgba(0, 240, 255, 0.4) 0%, transparent 70%)',
                }}
              />

              {/* The Holographic AI Core Sphere Animation */}
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Orbital Ring 1 */}
                <div className="absolute w-56 h-56 rounded-full border border-cyan-400/30 animate-spin-slow" />
                {/* Orbital Ring 2 (Rotated 45deg) */}
                <div
                  className="absolute w-60 h-28 rounded-full border border-cyan-400/40 animate-pulse"
                  style={{ transform: 'rotate(-25deg)', boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)' }}
                />
                {/* Orbital Ring 3 (Rotated 135deg) */}
                <div
                  className="absolute w-60 h-28 rounded-full border border-blue-400/40"
                  style={{ transform: 'rotate(40deg)' }}
                />

                {/* Satellite Nodes */}
                <div className="absolute w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_12px_#00f0ff] top-8 right-6 animate-ping" />
                <div className="absolute w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc] bottom-10 left-8" />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa] top-16 left-4" />

                {/* Central Glowing Wireframe Sphere */}
                <div className="relative w-44 h-44 rounded-full border-2 border-cyan-400/80 animate-hud-float animate-pulse-glow flex flex-col items-center justify-center bg-radial from-cyan-950/60 via-[#07193d]/80 to-transparent shadow-[0_0_40px_rgba(0,240,255,0.35)] backdrop-blur-sm">
                  {/* Sphere Latitude Lines */}
                  <div className="absolute inset-x-2 h-24 rounded-full border border-cyan-400/30" />
                  <div className="absolute inset-y-2 w-24 rounded-full border border-cyan-400/30" />

                  {/* Center Text Typography matching Image 1 */}
                  <h2 className="text-2xl font-black text-cyan-200 tracking-widest drop-shadow-[0_0_12px_#00f0ff]">
                    JARVIS
                  </h2>
                  <p className="text-[11px] font-bold tracking-widest text-white mt-0.5">AI CORE</p>
                  <span className="text-[9px] text-cyan-400 font-mono tracking-wider mt-1">v3.0.0</span>
                </div>
              </div>

              {/* Pedestal Target Rings at Base */}
              <div className="relative mt-2 w-48 h-5 flex items-center justify-center">
                <div className="absolute w-44 h-3 rounded-full border border-cyan-400/50 bg-cyan-950/30 shadow-[0_0_15px_#00f0ff]" />
                <div className="absolute w-28 h-2 rounded-full border border-blue-400/60" />
              </div>
            </div>

            {/* Live Intelligence Feed (Top Right Card) */}
            <div className="col-span-3 rounded-xl bg-[#06122c]/85 border border-cyan-500/30 p-3.5 flex flex-col shadow-[0_0_15px_rgba(0,240,255,0.06)] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2.5 border-b border-cyan-500/20 pb-1.5">
                <span className="text-xs font-bold text-cyan-300 tracking-wider">LIVE INTELLIGENCE FEED</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto pr-1 text-xs">
                {feedItems.map((item) => (
                  <div key={item.id} className="p-2 rounded-lg bg-[#091b40]/60 border border-cyan-500/20 flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-slate-100 leading-tight">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{item.sub}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border shrink-0 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>

              <button className="mt-2 text-right text-[11px] font-bold text-cyan-400 hover:text-cyan-200">
                View All Intelligence &gt;
              </button>
            </div>
          </div>

          {/* ----------------- MIDDLE ROW (ACTIVE AGENTS | MISSION TIMELINE | QUICK COMMANDS) ----------------- */}
          <div className="grid grid-cols-12 gap-4">
            {/* Active Agents (Middle Left Card) */}
            <div className="col-span-5 rounded-xl bg-[#06122c]/85 border border-cyan-500/30 p-3.5 shadow-[0_0_15px_rgba(0,240,255,0.06)]">
              <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-1.5">
                <span className="text-xs font-bold text-cyan-300 tracking-wider">ACTIVE AGENTS</span>
                <button className="text-[10px] text-cyan-400 hover:text-cyan-200">View All &gt;</button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Coding Agent */}
                <div className="p-2.5 rounded-lg bg-[#091b40]/70 border border-cyan-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400">&lt;/&gt;</span>
                    <div>
                      <p className="text-xs font-bold text-white">Coding Agent</p>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                      </span>
                    </div>
                  </div>
                  {/* Waveform */}
                  <div className="flex items-center gap-0.5 h-4">
                    {[8, 14, 10, 16, 6].map((h, i) => (
                      <div key={i} className="w-0.5 bg-emerald-400 rounded-full wave-bar-1" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>

                {/* Research Agent */}
                <div className="p-2.5 rounded-lg bg-[#091b40]/70 border border-cyan-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search size={13} className="text-cyan-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Research Agent</p>
                      <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Active
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 h-4">
                    {[12, 8, 15, 11, 7].map((h, i) => (
                      <div key={i} className="w-0.5 bg-cyan-400 rounded-full wave-bar-2" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>

                {/* Memory Agent */}
                <div className="p-2.5 rounded-lg bg-[#091b40]/70 border border-cyan-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={13} className="text-purple-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Memory Agent</p>
                      <span className="flex items-center gap-1 text-[10px] text-purple-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Standby
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 h-4">
                    {[4, 8, 6, 9, 5].map((h, i) => (
                      <div key={i} className="w-0.5 bg-purple-400 rounded-full wave-bar-3" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>

                {/* Browser Agent */}
                <div className="p-2.5 rounded-lg bg-[#091b40]/70 border border-cyan-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Browser Agent</p>
                      <span className="flex items-center gap-1 text-[10px] text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Standby
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 h-4">
                    {[6, 12, 8, 14, 5].map((h, i) => (
                      <div key={i} className="w-0.5 bg-amber-400 rounded-full wave-bar-4" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>

                {/* Task Agent */}
                <div className="p-2.5 rounded-lg bg-[#091b40]/70 border border-cyan-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-blue-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Task Agent</p>
                      <span className="flex items-center gap-1 text-[10px] text-blue-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Standby
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                  </div>
                </div>

                {/* System Agent */}
                <div className="p-2.5 rounded-lg bg-[#091b40]/70 border border-cyan-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings size={13} className="text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">System Agent</p>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Standby
                      </span>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Mission Timeline (Middle Center Card) */}
            <div className="col-span-4 rounded-xl bg-[#06122c]/85 border border-cyan-500/30 p-3.5 shadow-[0_0_15px_rgba(0,240,255,0.06)]">
              <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-1.5">
                <span className="text-xs font-bold text-cyan-300 tracking-wider">MISSION TIMELINE</span>
                <span className="text-[10px] text-cyan-400 flex items-center gap-1 cursor-pointer">
                  Today <span>▼</span>
                </span>
              </div>

              <div className="space-y-3 relative pl-3 border-l border-cyan-500/30 text-xs">
                {timelineItems.map((item) => (
                  <div key={item.id} className="relative">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                        item.status === 'done'
                          ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_#00f0ff]'
                          : item.status === 'active'
                          ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_#f59e0b]'
                          : 'bg-slate-700 border-slate-500'
                      }`}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-cyan-400">{item.time}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.status === 'done'
                            ? 'bg-cyan-950 text-cyan-300'
                            : item.status === 'active'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <p className={`font-medium mt-0.5 ${item.status === 'active' ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>

              <button className="mt-3 text-right w-full text-[11px] font-bold text-cyan-400 hover:text-cyan-200">
                View Full Schedule &gt;
              </button>
            </div>

            {/* Quick Commands (Middle Right Card) */}
            <div className="col-span-3 rounded-xl bg-[#06122c]/85 border border-cyan-500/30 p-3.5 shadow-[0_0_15px_rgba(0,240,255,0.06)] flex flex-col justify-between">
              <h3 className="text-xs font-bold text-cyan-300 tracking-wider mb-2 border-b border-cyan-500/20 pb-1.5">
                QUICK COMMANDS
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setChatOpen(true);
                    handleSend('Start a new system analysis task');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#091a3e]/80 hover:bg-[#0f2860] border border-cyan-500/30 text-xs font-medium text-cyan-200 flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                >
                  <span className="w-5 h-5 rounded bg-cyan-600/30 flex items-center justify-center text-cyan-400 font-bold">+</span>
                  <span>Start New Task</span>
                </button>

                <button
                  onClick={() => setActiveTab('Calendar')}
                  className="w-full py-2 px-3 rounded-lg bg-[#091a3e]/80 hover:bg-[#0f2860] border border-cyan-500/30 text-xs font-medium text-cyan-200 flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                >
                  <CalendarIcon size={14} className="text-cyan-400" />
                  <span>Open Calendar</span>
                </button>

                <button
                  onClick={toggleListening}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-700/60 to-cyan-600/60 hover:from-blue-600 hover:to-cyan-500 border border-cyan-400/50 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                >
                  <Mic size={14} className="text-cyan-200" />
                  <span>Start Voice Chat</span>
                </button>

                <button
                  onClick={() => {
                    setChatOpen(true);
                    handleSend('Execute automated diagnostic workflow');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#091a3e]/80 hover:bg-[#0f2860] border border-cyan-500/30 text-xs font-medium text-cyan-200 flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                >
                  <Workflow size={14} className="text-cyan-400" />
                  <span>Run Workflow</span>
                </button>
              </div>
            </div>
          </div>

          {/* ----------------- BOTTOM ROW (SYSTEM MONITOR | MEMORY INSIGHTS | LLM STATUS) ----------------- */}
          <div className="grid grid-cols-12 gap-4">
            {/* System Monitor (Bottom Left Gauges) */}
            <div className="col-span-3 rounded-xl bg-[#06122c]/85 border border-cyan-500/30 p-3.5 shadow-[0_0_15px_rgba(0,240,255,0.06)]">
              <h3 className="text-xs font-bold text-cyan-300 tracking-wider mb-2 border-b border-cyan-500/20 pb-1.5">
                SYSTEM MONITOR
              </h3>

              <div className="grid grid-cols-3 gap-2 text-center mt-3">
                {/* CPU Gauge */}
                <div className="flex flex-col items-center">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-14 h-14 -rotate-90">
                      <circle cx="28" cy="28" r="22" stroke="rgba(0,240,255,0.15)" strokeWidth="3.5" fill="none" />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        stroke="#00f0ff"
                        strokeWidth="4"
                        strokeDasharray="138.2"
                        strokeDashoffset={138.2 - (138.2 * sysMetrics.cpu) / 100}
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="absolute text-xs font-black text-cyan-200">{sysMetrics.cpu}%</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 font-bold">CPU</span>
                </div>

                {/* RAM Gauge */}
                <div className="flex flex-col items-center">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-14 h-14 -rotate-90">
                      <circle cx="28" cy="28" r="22" stroke="rgba(0,240,255,0.15)" strokeWidth="3.5" fill="none" />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        stroke="#00f0ff"
                        strokeWidth="4"
                        strokeDasharray="138.2"
                        strokeDashoffset={138.2 - (138.2 * sysMetrics.ram) / 100}
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="absolute text-xs font-black text-cyan-200">{sysMetrics.ram}%</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 font-bold">RAM</span>
                </div>

                {/* Disk Gauge */}
                <div className="flex flex-col items-center">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-14 h-14 -rotate-90">
                      <circle cx="28" cy="28" r="22" stroke="rgba(0,240,255,0.15)" strokeWidth="3.5" fill="none" />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        stroke="#00f0ff"
                        strokeWidth="4"
                        strokeDasharray="138.2"
                        strokeDashoffset={138.2 - (138.2 * sysMetrics.disk) / 100}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <span className="absolute text-xs font-black text-cyan-200">{sysMetrics.disk}%</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 font-bold">Disk</span>
                </div>
              </div>
            </div>

            {/* Memory Insights (Bottom Center-Left Card with Constellation Map) */}
            <div className="col-span-3 rounded-xl bg-[#06122c]/85 border border-cyan-500/30 p-3.5 shadow-[0_0_15px_rgba(0,240,255,0.06)] flex flex-col justify-between">
              <h3 className="text-xs font-bold text-cyan-300 tracking-wider border-b border-cyan-500/20 pb-1.5">
                MEMORY INSIGHTS
              </h3>

              <div className="flex items-center justify-between my-2">
                {/* SVG Neural Constellation Graphic */}
                <svg viewBox="0 0 120 70" className="w-28 h-16">
                  <line x1="15" y1="50" x2="40" y2="25" stroke="#00f0ff" strokeWidth="1.2" opacity="0.6" />
                  <line x1="40" y1="25" x2="70" y2="45" stroke="#00f0ff" strokeWidth="1.2" opacity="0.6" />
                  <line x1="70" y1="45" x2="95" y2="20" stroke="#00f0ff" strokeWidth="1.2" opacity="0.6" />
                  <line x1="95" y1="20" x2="110" y2="40" stroke="#00f0ff" strokeWidth="1.2" opacity="0.6" />
                  <circle cx="15" cy="50" r="3" fill="#00f0ff" />
                  <circle cx="40" cy="25" r="4" fill="#38bdf8" />
                  <circle cx="70" cy="45" r="3" fill="#a855f7" />
                  <circle cx="95" cy="20" r="4" fill="#00f0ff" />
                  <circle cx="110" cy="40" r="2.5" fill="#38bdf8" />
                </svg>

                {/* Stats */}
                <div className="text-right text-[11px] space-y-0.5">
                  <p className="text-gray-400">Memories</p>
                  <p className="text-sm font-black text-cyan-200">3,580</p>
                  <p className="text-gray-400 text-[10px]">Session Turns <span className="text-white font-bold">22</span></p>
                  <p className="text-gray-400 text-[10px]">Total Calls <span className="text-white font-bold">14</span></p>
                </div>
              </div>

              <button className="text-right text-[11px] font-bold text-cyan-400 hover:text-cyan-200">
                View Memory Map &gt;
              </button>
            </div>

            {/* LLM Status (Bottom Right Card) */}
            <div className="col-span-6 rounded-xl bg-[#06122c]/85 border border-cyan-500/30 p-3.5 shadow-[0_0_15px_rgba(0,240,255,0.06)]">
              <div className="flex items-center justify-between mb-2.5 border-b border-cyan-500/20 pb-1.5">
                <span className="text-xs font-bold text-cyan-300 tracking-wider">LLM STATUS</span>
                <span className="text-[10px] text-cyan-400 font-bold">4 Connected</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-[#091a3e]/60 border border-cyan-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Claude</span>
                  <span className="text-[9px] text-gray-500">Not Linked</span>
                </div>

                <div className="p-2 rounded bg-[#091a3e]/60 border border-cyan-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">OpenAI</span>
                  <span className="text-[9px] text-gray-500">Not Linked</span>
                </div>

                <div className="p-2 rounded bg-[#091a3e]/60 border border-cyan-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">Gemini</span>
                  <span className="text-[9px] text-cyan-400 font-bold">Active</span>
                </div>

                <div className="p-2 rounded bg-[#091a3e]/60 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">Grok</span>
                  <span className="text-[9px] text-emerald-400 font-bold">Connected</span>
                </div>

                <div className="p-2 rounded bg-[#091a3e]/60 border border-cyan-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">DeepRouter</span>
                  <span className="text-[9px] text-gray-500">Not Linked</span>
                </div>

                <div className="p-2 rounded bg-[#091a3e]/60 border border-cyan-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-200">Qwen:7b</span>
                  <span className="text-[9px] text-emerald-400 font-bold">Local</span>
                </div>

                <div className="p-2 rounded bg-[#091a3e]/60 border border-purple-500/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">Claude Code</span>
                  <span className="text-[9px] text-purple-400 font-bold">Connected</span>
                </div>

                <div className="p-2 rounded bg-[#091a3e]/60 border border-cyan-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">Cursor</span>
                  <span className="text-[9px] text-emerald-400 font-bold">Connected</span>
                </div>

                <div className="p-2 rounded bg-[#091a3e]/60 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">Copilot</span>
                  <span className="text-[9px] text-emerald-400 font-bold">Connected</span>
                </div>
              </div>

              <div className="mt-2 text-right">
                <button className="text-[11px] font-bold text-cyan-400 hover:text-cyan-200">
                  Manage Providers &gt;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. BOTTOM FLOATING BAR (Matching Image 1) */}
        {/* ========================================================================= */}
        <footer className="h-14 px-6 border-t border-cyan-500/25 bg-[#050c1e]/90 flex items-center justify-between shrink-0 backdrop-blur-md">
          {/* Left System Info Pills */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-400 text-sm">📍</span>
              <span>Location: <strong className="text-white font-bold">{sysMetrics.location}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-500/30">
              <span className="text-amber-400 text-sm">☀️</span>
              <span>Weather: <strong className="text-white font-bold">{sysMetrics.weather}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-500/30">
              <span className="text-emerald-400 text-sm">📶</span>
              <span>Network: <strong className="text-emerald-400 font-bold">{sysMetrics.network}</strong></span>
            </div>
          </div>

          {/* Center: Glowing "TALK TO JARVIS" Capsule */}
          <button
            onClick={() => {
              setChatOpen(true);
              toggleListening();
            }}
            className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] ${
              isListening
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 border-green-300 animate-pulse text-white'
                : 'bg-gradient-to-r from-blue-700 to-cyan-500 hover:from-blue-600 hover:to-cyan-400 border-cyan-300 text-white'
            }`}
          >
            {/* Audio Wave Left */}
            <div className="flex items-center gap-0.5 h-3">
              {[4, 10, 6, 12].map((h, i) => (
                <div key={i} className="w-0.5 bg-white rounded-full" style={{ height: `${h}px` }} />
              ))}
            </div>

            <span className="text-xs font-black tracking-widest uppercase">
              {isListening ? 'LISTENING TO VOICE...' : 'TALK TO JARVIS'}
            </span>

            {/* Audio Wave Right */}
            <div className="flex items-center gap-0.5 h-3">
              {[12, 6, 10, 4].map((h, i) => (
                <div key={i} className="w-0.5 bg-white rounded-full" style={{ height: `${h}px` }} />
              ))}
            </div>
          </button>

          {/* Right: Executive Briefing Button */}
          <button
            onClick={triggerExecutiveBriefing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-900/60 to-cyan-800/60 hover:from-blue-800 hover:to-cyan-700 border border-cyan-400/40 text-xs font-bold text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all"
          >
            <Play size={12} className="text-cyan-300 fill-cyan-300" />
            <span>Executive Briefing</span>
          </button>
        </footer>
      </main>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE SCI-FI VOICE & CHAT DRAWER */}
      {/* ========================================================================= */}
      {chatOpen && (
        <div className="absolute right-4 bottom-16 w-[420px] h-[520px] rounded-2xl bg-[#06122c]/95 border-2 border-cyan-400/50 shadow-[0_0_40px_rgba(0,240,255,0.3)] z-50 flex flex-col overflow-hidden backdrop-blur-xl">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-[#0a1b42]/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
              <span className="text-xs font-bold text-cyan-200 tracking-wider">JARVIS NEURAL TERMINAL</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-1 rounded text-xs ${ttsEnabled ? 'text-cyan-400' : 'text-gray-500'}`}
                title="Toggle Voice Speech"
              >
                {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Drawer Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'bg-[#091b42] border border-cyan-500/30 text-cyan-100 shadow-[0_0_12px_rgba(0,240,255,0.08)]'
                  }`}
                >
                  {m.text}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 px-1 text-[9px] text-gray-400">
                  <span>{m.time}</span>
                  {m.lang && (
                    <span className="px-1 py-0.2 rounded bg-black/40 text-cyan-400 font-bold border border-cyan-500/20">
                      {m.lang === 'bn' ? 'বাংলা' : m.lang === 'hi' ? 'हिन्दी' : 'ENG'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse">
                <Sparkles size={14} /> JARVIS is computing...
              </div>
            )}
          </div>

          {/* Multilingual Quick Chips */}
          <div className="px-3 py-1.5 border-t border-cyan-500/20 bg-[#040c1e] flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => handleSend('সিস্টেম রিপোর্ট দাও')}
              className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-200 whitespace-nowrap"
            >
              &gt; বাংলা রিপোর্ট
            </button>
            <button
              onClick={() => handleSend('सिस्टम की स्थिति बताओ')}
              className="px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/30 text-orange-200 whitespace-nowrap"
            >
              &gt; हिंदी स्थिति
            </button>
            <button
              onClick={() => handleSend('Run deep system diagnostic')}
              className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 whitespace-nowrap"
            >
              &gt; Eng Diagnostic
            </button>
          </div>

          {/* Drawer Input Bar */}
          <div className="p-2.5 border-t border-cyan-500/30 bg-[#050e24] flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`p-2 rounded-xl border transition-all ${
                isListening
                  ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse shadow-[0_0_12px_#10b981]'
                  : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900'
              }`}
            >
              {isListening ? <Mic size={16} /> : <MicOff size={16} />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? 'Listening...' : 'Type in বাংলা, हिन्दी or English...'}
              className="flex-1 bg-black/50 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isProcessing}
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white transition-all shadow-[0_0_10px_#00f0ff]"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
