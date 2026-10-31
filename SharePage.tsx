import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, MessageSquare, ExternalLink, Calendar } from 'lucide-react';
import { marked } from 'marked';
import { Conversation } from '../types';
import { apiFetch } from '../lib/api';
import { ZenoOrb } from '../components/ZenoOrb';

export const SharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const data = await apiFetch(`/api/chat/share/${token}`);
        setConversation(data.conversation);
      } catch (err: any) {
        setError(err.message || 'Shared conversation not found or access revoked.');
      } finally {
        setLoading(false);
      }
    };

    fetchShared();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080b] flex items-center justify-center">
        <ZenoOrb size="md" state="thinking" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="text-rose-400 text-lg font-bold">Access Unavailable</div>
        <p className="text-xs text-slate-400 max-w-sm">{error || 'This conversation is no longer available.'}</p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-white/10 text-xs text-white hover:bg-white/15">
          Return to ZENO AI
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 pb-16">
      {/* Top Banner */}
      <header className="h-16 px-6 md:px-12 flex items-center justify-between border-b border-white/10 glass-panel sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          <span>ZENO AI NEXT</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/20">
            Read-only Shared Conversation
          </span>
          <Link
            to="/register"
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition"
          >
            Start Chatting
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        <div className="border-b border-white/10 pb-6 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {conversation.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Model: {conversation.model}</span>
            <span>•</span>
            <span className="uppercase text-cyan-400">{conversation.mode}</span>
            <span>•</span>
            <span>{new Date(conversation.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="space-y-6">
          {conversation.messages?.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl border transition
                  ${isUser
                    ? 'bg-white/5 border-white/10 ml-8 md:ml-16'
                    : 'bg-black/40 border-white/15 mr-8 md:mr-16'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-xs tracking-wider text-slate-200">
                    {isUser ? '👤 User' : '✦ ZENO AI'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className="prose-zeno text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(msg.content, { gfm: true, breaks: true }) as string
                  }}
                />

                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-4 border-t border-white/10 mt-4 space-y-1">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Sources Cited
                    </span>
                    {msg.citations.map((c, cIdx) => (
                      <div key={cIdx} className="text-xs">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{c.title}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
