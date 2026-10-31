import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  MessageSquare,
  FileText,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const AdminContentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'files'>('conversations');

  // Conversations
  const [conversations, setConversations] = useState<any[]>([]);
  const [convPagination, setConvPagination] = useState({ page: 1, limit: 20, total: 0 });

  // Files
  const [files, setFiles] = useState<any[]>([]);
  const [filePagination, setFilePagination] = useState({ page: 1, limit: 20, total: 0 });

  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/admin/content/conversations?page=${convPagination.page}&limit=${convPagination.limit}`);
      setConversations(res.conversations || []);
      setConvPagination(res.pagination || { page: 1, limit: 20, total: 0 });
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/admin/files?page=${filePagination.page}&limit=${filePagination.limit}`);
      setFiles(res.files || []);
      setFilePagination(res.pagination || { page: 1, limit: 20, total: 0 });
    } catch (err) {
      console.warn('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'conversations') fetchConversations();
    else fetchFiles();
  }, [activeTab, convPagination.page, filePagination.page]);

  const deleteConversation = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this conversation? This will be recorded in the audit trail.')) return;
    try {
      await apiFetch(`/api/admin/content/conversations/${id}`, { method: 'DELETE' });
      fetchConversations();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const deleteFile = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? Physical storage and vector chunks will be purged.`)) return;
    try {
      await apiFetch(`/api/admin/files/${id}`, { method: 'DELETE' });
      fetchFiles();
    } catch (err: any) {
      alert('File delete failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-cyan-400" />
          <span>Tenant Content & Storage Oversight</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Audited administrative supervision of user conversations and uploaded multi-format documents.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'conversations'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Conversations ({convPagination.total})</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'files'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Uploaded Files ({filePagination.total})</span>
        </button>
      </div>

      {/* Conversations Table */}
      {activeTab === 'conversations' && (
        <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">Conversation</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Messages</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {conversations.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{c.title || 'Untitled'}</div>
                    <div className="text-[10px] text-slate-400">{c.id}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div>{c.user_name}</div>
                    <div className="text-[10px] text-slate-400">{c.user_email}</div>
                  </td>
                  <td className="py-3 px-4 text-cyan-400">{c.model || 'auto'}</td>
                  <td className="py-3 px-4 text-slate-300">{c.message_count || 0}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{c.updated_at}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteConversation(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete Conversation Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Files Table */}
      {activeTab === 'files' && (
        <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">MIME Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">RAG Chunks</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-white/5 transition">
                  <td className="py-3 px-4 font-semibold text-white">{f.original_name}</td>
                  <td className="py-3 px-4 text-slate-300">
                    <div>{f.user_name}</div>
                    <div className="text-[10px] text-slate-400">{f.user_email}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{f.mime_type}</td>
                  <td className="py-3 px-4 text-slate-300">
                    {Math.round((f.size_bytes || 0) / 1024)} KB
                  </td>
                  <td className="py-3 px-4 text-cyan-400">{f.chunk_count || 0} chunks</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteFile(f.id, f.original_name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete File from Storage & Vector DB"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
