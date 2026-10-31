import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Share2,
  Download,
  Trash2,
  Menu,
  Check,
  AlertCircle,
  Archive,
  RefreshCw
} from 'lucide-react';
import { Conversation, Message, Attachment, AIMode, WeatherData, LocationData } from '../types';
import { apiFetch, getStoredToken } from '../lib/api';
import { ModelSelector } from '../features/chat/ModelSelector';
import { ModeSelector } from '../features/chat/ModeSelector';
import { MessageItem } from '../features/chat/MessageItem';
import { Composer } from '../features/chat/Composer';
import { EmptyState } from '../features/chat/EmptyState';

interface ChatPageProps {
  onToggleMobileSidebar: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onToggleMobileSidebar }) => {
  const { id: routeChatId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [currentMode, setCurrentMode] = useState<AIMode>('chat');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [streamingWeather, setStreamingWeather] = useState<WeatherData | null>(null);
  const [streamingLocation, setStreamingLocation] = useState<LocationData | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, streamingText]);

  // Load Conversation
  useEffect(() => {
    if (!routeChatId) {
      setConversation(null);
      setMessages([]);
      return;
    }

    const fetchConv = async () => {
      try {
        const data = await apiFetch(`/api/chat/conversations/${routeChatId}`);
        setConversation(data.conversation);
        setMessages(data.conversation.messages || []);
        if (data.conversation.model) setSelectedModel(data.conversation.model);
        if (data.conversation.mode) setCurrentMode(data.conversation.mode === 'voice' ? 'chat' : data.conversation.mode);
      } catch (err) {
        console.warn('Failed to load conversation:', err);
        navigate('/app/chat');
      }
    };

    fetchConv();
  }, [routeChatId, navigate]);

  // Handle Send Message & SSE Streaming
  const handleSendMessage = async (
    content: string,
    attachments: Attachment[] = [],
    webSearch = false,
    clientLocation?: { latitude: number; longitude: number } | null
  ) => {
    if (isStreaming) return;

    let chatId: string = routeChatId || '';

    // Create chat if not exists
    if (!chatId) {
      try {
        const createRes = await apiFetch('/api/chat/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: content.slice(0, 32),
            model: selectedModel,
            mode: currentMode
          })
        });
        chatId = createRes.conversation.id;
        navigate(`/app/chat/${chatId}`, { replace: true });
      } catch (err) {
        console.error('Failed to create chat:', err);
        return;
      }
    }

    const tempUserMsg: Message = {
      id: 'tmp-usr-' + Date.now(),
      conversation_id: chatId,
      user_id: 'me',
      role: 'user',
      content,
      attachments,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingText('');
    setStatusMessage('Connecting to ZENO neural router...');
    setStreamingWeather(null);
    setStreamingLocation(null);

    try {
      const token = getStoredToken();
      let response: Response | null = null;

      // Resilient connection with auto-retry on transient disconnects / reloads
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await fetch(`/api/chat/conversations/${chatId}/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
              content,
              model: selectedModel,
              mode: currentMode === 'voice' ? 'chat' : currentMode,
              attachments,
              webSearch,
              clientLocation
            })
          });

          if (response.ok) break;
          if (response.status >= 500 && attempt < 3) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            continue;
          }
          throw new Error(`Server returned HTTP ${response.status}`);
        } catch (fetchErr: any) {
          if (attempt < 3 && (fetchErr.name === 'TypeError' || fetchErr.message?.includes('fetch') || fetchErr.message?.includes('network'))) {
            setStatusMessage(`Reconnecting to ZENO network (attempt ${attempt + 1})...`);
            await new Promise(r => setTimeout(r, 1200 * attempt));
            continue;
          }
          throw fetchErr;
        }
      }

      if (!response || !response.ok) {
        throw new Error('Unable to establish stream connection with server');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      let currentEvent = 'message';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

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
                setStreamingText(prev => prev + (parsed.delta || ''));
                setStatusMessage(null);
              } else if (currentEvent === 'status') {
                setStatusMessage(parsed.message || null);
              } else if (currentEvent === 'weather') {
                setStreamingWeather(parsed);
              } else if (currentEvent === 'location') {
                setStreamingLocation(parsed);
              } else if (currentEvent === 'error') {
                throw new Error(parsed.message || 'Stream generation failed');
              } else if (currentEvent === 'done') {
                setIsStreaming(false);
                setStreamingText('');
                setStatusMessage(null);
                setStreamingWeather(null);
                setStreamingLocation(null);
                setMessages(prev => [...prev, parsed]);
              }
            } catch (pErr: any) {
              if (currentEvent === 'error') throw pErr;
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Chat streaming failed:', err);
      setIsStreaming(false);
      setStatusMessage(null);
      setStreamingWeather(null);
      setStreamingLocation(null);
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          conversation_id: chatId,
          user_id: 'zeno',
          role: 'assistant',
          content: `⚠️ **Connection Note:** ${err.message || 'Unable to establish streaming session.'}. Please click retry to continue.`,
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const handleShare = async () => {
    if (!routeChatId) return;
    try {
      const data = await apiFetch(`/api/chat/conversations/${routeChatId}/share`, { method: 'POST' });
      const shareUrl = `${window.location.origin}/share/${data.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleExport = async (format: 'markdown' | 'json' | 'txt' | 'zip') => {
    if (!routeChatId) return;
    try {
      const token = getStoredToken();
      const res = await fetch(`/api/chat/conversations/${routeChatId}/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'zip' ? 'zip' : format === 'markdown' ? 'md' : format;
      a.download = `zeno-${format === 'zip' ? 'project' : 'chat'}-${routeChatId.slice(0, 8)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Direct blob export fallback:', err);
      const token = getStoredToken();
      window.open(`/api/chat/conversations/${routeChatId}/export?format=${format}${token ? `&token=${encodeURIComponent(token)}` : ''}`, '_blank');
    }
    setIsExportOpen(false);
  };

  const handleDeleteChat = async () => {
    if (!routeChatId) return;
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await apiFetch(`/api/chat/conversations/${routeChatId}`, { method: 'DELETE' });
      navigate('/app/chat');
    } catch {}
  };

  const handleStartInteractiveAction = async (title: string, mode: string, initialQuestion: string) => {
    const targetMode = (mode as AIMode) || 'chat';
    setCurrentMode(targetMode);

    try {
      const createRes = await apiFetch('/api/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title,
          model: selectedModel,
          mode: targetMode,
          initialAssistantMessage: initialQuestion
        })
      });

      if (createRes.conversation) {
        setConversation(createRes.conversation);
        setMessages(createRes.conversation.messages || []);
        navigate(`/app/chat/${createRes.conversation.id}`);
      }
    } catch (err) {
      console.error('Failed to start interactive action:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#07080b]">
      {/* Top Navigation Bar */}
      <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/10 glass-panel z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="flex lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />

          <ModeSelector
            currentMode={currentMode}
            onSelectMode={setCurrentMode}
          />
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5">
          {routeChatId && (
            <>
              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300 hover:text-white hover:border-cyan-500/40 transition"
                title="Create public share link"
              >
                {shareCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="p-2 rounded-xl glass-card text-slate-400 hover:text-white hover:border-cyan-500/40 transition"
                  title="Export conversation"
                >
                  <Download className="w-4 h-4" />
                </button>

                {isExportOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsExportOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl glass-panel-elevated py-1 shadow-2xl z-50 text-xs border border-white/15">
                      <button
                        onClick={() => handleExport('zip')}
                        className="w-full px-3 py-2 text-left text-cyan-400 hover:text-cyan-300 hover:bg-white/10 flex items-center gap-2 font-medium"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        VS Code Project (.zip)
                      </button>
                      <button
                        onClick={() => handleExport('markdown')}
                        className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-white/10"
                      >
                        Markdown (.md)
                      </button>
                      <button
                        onClick={() => handleExport('txt')}
                        className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-white/10"
                      >
                        Plain Text (.txt)
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-white/10"
                      >
                        JSON (.json)
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Delete Chat */}
              <button
                onClick={handleDeleteChat}
                className="p-2 rounded-xl glass-card text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
                title="Delete this chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Conversation Area */}
      <main className="flex-1 overflow-y-auto relative">
        {messages.length === 0 && !isStreaming ? (
          <EmptyState
            onSelectPrompt={(prompt, mode) => {
              if (mode) setCurrentMode(mode as AIMode);
              handleSendMessage(prompt);
            }}
            onStartInteractiveAction={handleStartInteractiveAction}
          />
        ) : (
          <div className="divide-y divide-white/5 pb-8">
            {messages.map(msg => (
              <MessageItem key={msg.id} message={msg} conversationId={routeChatId} />
            ))}

            {/* Live Streaming Message Display */}
            {isStreaming && (
              <MessageItem
                message={{
                  id: 'streaming-active',
                  conversation_id: routeChatId || '',
                  user_id: 'zeno',
                  role: 'assistant',
                  content: streamingText,
                  model: selectedModel,
                  weather: streamingWeather || undefined,
                  location: streamingLocation || undefined,
                  created_at: new Date().toISOString()
                }}
                isStreaming={true}
                statusMessage={statusMessage}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Multi-Function Composer */}
      <footer className="shrink-0 z-20">
        <Composer
          onSendMessage={handleSendMessage}
          disabled={isStreaming}
          currentMode={currentMode}
          onSetMode={setCurrentMode}
        />
      </footer>
    </div>
  );
};
