import { useState } from 'react';
import { ChatArea } from '../components/Chat/ChatArea';
import { SystemPanel } from '../components/Chat/SystemPanel';
import { HologramVoiceAgent } from '../components/Hologram/HologramVoiceAgent';
import { JarvisCommandCenter } from '../components/CommandCenter/JarvisCommandCenter';
import { useAppStore } from '../lib/store';
import { Grid, Sparkles, MessageSquare } from 'lucide-react';

export function ChatPage() {
  const systemPanelOpen = useAppStore((s) => s.systemPanelOpen);
  const [viewMode, setViewMode] = useState<'command-center' | 'hologram' | 'classic'>('command-center');

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      {/* View Switcher Pill at Top Right */}
      <div className="absolute top-2.5 right-6 z-40 flex items-center bg-[#070b16]/95 border border-cyan-500/40 rounded-full p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.25)] backdrop-blur-md">
        <button
          onClick={() => setViewMode('command-center')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            viewMode === 'command-center'
              ? 'bg-cyan-500 text-black shadow-[0_0_10px_#00f0ff]'
              : 'text-gray-400 hover:text-cyan-300'
          }`}
          title="JARVIS Command Center HUD"
        >
          <Grid size={13} />
          <span>Command Center</span>
        </button>

        <button
          onClick={() => setViewMode('hologram')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            viewMode === 'hologram'
              ? 'bg-purple-600 text-white shadow-[0_0_10px_#a855f7]'
              : 'text-gray-400 hover:text-purple-300'
          }`}
          title="Holographic Avatar View"
        >
          <Sparkles size={13} />
          <span>Hologram Avatar</span>
        </button>

        <button
          onClick={() => setViewMode('classic')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            viewMode === 'classic'
              ? 'bg-blue-600 text-white shadow-[0_0_10px_#3b82f6]'
              : 'text-gray-400 hover:text-blue-300'
          }`}
          title="Classic Minimal Chat"
        >
          <MessageSquare size={13} />
          <span>Classic Chat</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        {viewMode === 'command-center' ? (
          <JarvisCommandCenter />
        ) : viewMode === 'hologram' ? (
          <HologramVoiceAgent />
        ) : (
          <div className="flex h-full overflow-hidden">
            <div className="flex-1 min-w-0">
              <ChatArea />
            </div>
            {systemPanelOpen && <SystemPanel />}
          </div>
        )}
      </div>
    </div>
  );
}
