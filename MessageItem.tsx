import React, { useState } from 'react';
import { marked } from 'marked';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Film,
  Terminal,
  Activity,
  Archive
} from 'lucide-react';
import { Message } from '../../types';
import { getStoredToken } from '../../lib/api';
import { ZenoOrb } from '../../components/ZenoOrb';
import { WeatherCard } from '../../components/WeatherCard';
import { MapCard } from '../../components/MapCard';

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  statusMessage?: string | null;
  onRegenerate?: () => void;
  conversationId?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isStreaming = false, statusMessage = null, onRegenerate, conversationId }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<number | null>(message.feedback?.rating ?? null);
  const [showTools, setShowTools] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const targetConvId = conversationId || message.conversation_id;
  const hasCode = message.content.includes('```');

  const handleDownloadZip = async () => {
    if (!targetConvId || isDownloadingZip) return;
    try {
      setIsDownloadingZip(true);
      const token = getStoredToken();
      const res = await fetch(`/api/chat/conversations/${targetConvId}/export?format=zip`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Zip bundling failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zeno-project-${targetConvId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Direct zip download fallback:', err);
      const token = getStoredToken();
      window.open(`/api/chat/conversations/${targetConvId}/export?format=zip${token ? `&token=${encodeURIComponent(token)}` : ''}`, '_blank');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = message.content.replace(/```[\s\S]*?```/g, 'Code block omitted.');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const renderMarkdown = (raw: string) => {
    try {
      const html = marked.parse(raw, { gfm: true, breaks: true }) as string;
      return { __html: html };
    } catch {
      return { __html: raw };
    }
  };

  return (
    <div className={`py-6 px-4 md:px-8 transition-colors ${isUser ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
      <div className="max-w-4xl mx-auto flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/20">
              U
            </div>
          ) : (
            <div className="relative">
              <ZenoOrb size="sm" state={isStreaming ? 'thinking' : 'idle'} />
            </div>
          )}
        </div>

        {/* Message Content Area */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header Metadata */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs tracking-wider text-slate-200">
              {isUser ? 'You' : 'ZENO AI'}
            </span>
            {!isUser && message.model && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                {message.model}
              </span>
            )}
            <span className="text-[10px] text-slate-500 font-mono">
              {new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* User Attachments (Images, Videos, Files) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              {message.attachments.map((att, idx) => {
                const isImg = att.file_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(att.name);
                const isVid = att.file_type?.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(att.name);
                const fileUrl = att.preview_url || (att.file_path ? `/uploads/${att.file_path}` : '');

                if (isImg && fileUrl) {
                  return (
                    <a
                      key={idx}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block rounded-xl overflow-hidden border border-white/15 bg-black/40 hover:border-cyan-400/50 transition-all max-w-[240px] shadow-lg"
                      title={`Click to open ${att.name}`}
                    >
                      <img
                        src={fileUrl}
                        alt={att.name}
                        className="max-h-40 w-auto object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="px-2 py-1 bg-slate-900/90 text-[10px] text-slate-300 truncate font-mono">
                        {att.name}
                      </div>
                    </a>
                  );
                }

                if (isVid && fileUrl) {
                  return (
                    <div key={idx} className="rounded-xl overflow-hidden border border-white/15 bg-black/50 max-w-sm shadow-lg">
                      <video src={fileUrl} controls className="max-h-52 w-full rounded-t-xl" />
                      <div className="px-2 py-1 bg-slate-900/90 text-[10px] text-slate-300 truncate font-mono">
                        {att.name}
                      </div>
                    </div>
                  );
                }

                return (
                  <a
                    key={idx}
                    href={fileUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300 border border-white/10 hover:border-cyan-500/40 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate max-w-[180px]">{att.name}</span>
                  </a>
                );
              })}
            </div>
          )}

          {/* Tool Calls Accordion */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="rounded-xl border border-white/10 glass-card overflow-hidden">
              <button
                onClick={() => setShowTools(!showTools)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:text-white transition"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="font-mono">Tool Execution ({message.toolCalls.length})</span>
                </div>
                {showTools ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showTools && (
                <div className="p-3 bg-black/40 border-t border-white/10 text-xs font-mono space-y-1.5 text-slate-400">
                  {message.toolCalls.map((tc, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-cyan-400">✓</span>
                      <span>{tc.name}</span>
                      {tc.details && <span className="text-slate-500">- {tc.details}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Render Content */}
          <div className="text-slate-200 text-sm md:text-base leading-relaxed break-words font-normal">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : !message.content && isStreaming ? (
              /* Ultra-Sleek Futuristic Thinking Capsule */
              <div className="flex items-center gap-3 py-2 px-3.5 rounded-2xl bg-cyan-500/[0.06] border border-cyan-500/20 backdrop-blur-md w-fit shadow-md shadow-cyan-950/20 transition-all duration-300">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <span className="absolute w-full h-full rounded-full bg-cyan-400/30 animate-ping opacity-60" />
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow relative z-10" />
                </div>
                <span className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-indigo-200 to-cyan-300 tracking-wide">
                  {statusMessage || 'Preparing intelligent response...'}
                </span>
                <span className="flex items-center gap-1 ml-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-bounce" />
                </span>
              </div>
            ) : (
              <>
                {/* Active Tool Status Tag if tool is running alongside content */}
                {isStreaming && statusMessage && (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-[11px] font-mono text-cyan-300 mb-2.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>{statusMessage}</span>
                  </div>
                )}

                <div className="relative inline">
                  <div
                    className="prose-zeno space-y-3 inline"
                    dangerouslySetInnerHTML={renderMarkdown(message.content)}
                  />
                  {/* Futuristic Slim Glowing Neon Caret */}
                  {isStreaming && (
                    <span className="inline-block w-[2.5px] h-[1.15em] ml-1 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.95)] align-text-bottom animate-pulse rounded-full" />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Live Verified Weather Card */}
          {message.weather && (
            <WeatherCard weather={message.weather} />
          )}

          {/* Interactive Geospatial Map Card */}
          {message.location && (
            <MapCard location={message.location} />
          )}

          {/* Citations Preview Cards */}
          {message.citations && message.citations.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3 text-cyan-400" />
                <span>Verified Sources ({message.citations.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.citations.map((c, idx) => {
                  const isDoc = c.url?.startsWith('/api/files') || c.url?.startsWith('#doc') || c.title?.includes('(Uploaded Document)');
                  return (
                    <a
                      key={idx}
                      href={c.url}
                      target={isDoc && c.url?.startsWith('#') ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 p-2.5 rounded-xl glass-card hover:border-cyan-500/40 text-left transition group"
                    >
                      <div className="w-5 h-5 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 font-mono text-[10px] mt-0.5">
                        {isDoc ? <FileText className="w-3 h-3 text-cyan-400" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate flex items-center gap-1.5">
                          <span className="truncate">{c.title}</span>
                          {isDoc && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal shrink-0">Document</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {c.snippet}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono truncate mt-1">
                          {isDoc ? 'Verified Primary Document' : c.url}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assistant Action Bar */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-1 pt-1 opacity-70 hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleSpeak}
                className={`p-1.5 rounded-lg transition ${isSpeaking ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                title={isSpeaking ? 'Stop speech' : 'Read aloud'}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="w-px h-3.5 bg-white/10 mx-1" />

              <button
                onClick={() => setFeedback(feedback === 1 ? null : 1)}
                className={`p-1.5 rounded-lg transition ${feedback === 1 ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setFeedback(feedback === -1 ? null : -1)}
                className={`p-1.5 rounded-lg transition ${feedback === -1 ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>

              {hasCode && targetConvId && (
                <button
                  onClick={handleDownloadZip}
                  disabled={isDownloadingZip}
                  className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 font-medium transition shadow-sm"
                  title="Download complete project files as a ready-to-run ZIP archive for VS Code"
                >
                  <Archive className={`w-3.5 h-3.5 text-cyan-400 ${isDownloadingZip ? 'animate-bounce' : ''}`} />
                  <span>{isDownloadingZip ? 'Bundling...' : 'VS Code Project (.zip)'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
