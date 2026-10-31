import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Search,
  Trash2,
  MessageSquare,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Database
} from 'lucide-react';
import { FileRecord } from '../types';
import { apiFetch } from '../lib/api';

export const FilesPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchChunks, setSearchChunks] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      const data = await apiFetch('/api/files');
      setFiles(data.files || []);
    } catch (err) {
      console.warn('Could not load files:', err);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < uploaded.length; i++) {
      const file = uploaded[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        await apiFetch('/api/files/upload', {
          method: 'POST',
          body: formData
        });
      } catch (err) {
        console.error('File upload failed:', err);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadFiles();
  };

  const handleDelete = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this file?')) return;
    try {
      await apiFetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (selectedFile?.id === fileId) setSelectedFile(null);
      loadFiles();
    } catch {}
  };

  const handleSearchChunks = async () => {
    if (!searchQuery.trim()) {
      setSearchChunks([]);
      return;
    }

    try {
      const data = await apiFetch('/api/files/search', {
        method: 'POST',
        body: JSON.stringify({ query: searchQuery.trim(), limit: 6 })
      });
      setSearchChunks(data.chunks || []);
    } catch {}
  };

  const handleAskAboutFile = (file: FileRecord) => {
    navigate('/app/chat', {
      state: {
        initialPrompt: `Please analyze the uploaded document "${file.original_name}" and provide a breakdown of its core contents.`
      }
    });
  };

  const getFileIcon = (mime: string, name: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-pink-400" />;
    if (mime.includes('csv') || name.endsWith('.xlsx')) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (mime.includes('json') || name.endsWith('.js') || name.endsWith('.py') || name.endsWith('.ts')) {
      return <FileCode className="w-5 h-5 text-amber-400" />;
    }
    return <FileText className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            File Intelligence & RAG
          </h1>
          <p className="text-xs text-slate-400">
            Upload enterprise documents, codebases, and data for automatic chunking and instant contextual chat
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUpload}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{isUploading ? 'Extracting & Indexing...' : 'Upload Files'}</span>
        </button>
      </div>

      {/* Cross-Document Retrieval Search */}
      <div className="rounded-2xl glass-panel p-4 border border-white/10 flex items-center gap-3">
        <Search className="w-5 h-5 text-cyan-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearchChunks()}
          placeholder="Search through all indexed document chunks & knowledge vectors..."
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={handleSearchChunks}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-slate-200 transition"
        >
          Search Chunks
        </button>
      </div>

      {/* Search Chunks Result Box */}
      {searchChunks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Retrieved Chunks ({searchChunks.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchChunks.map((chunk, idx) => (
              <div key={idx} className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                  <span className="truncate max-w-[200px]">{chunk.original_name}</span>
                  <span>Match Score: {chunk.score}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono line-clamp-4 bg-black/40 p-2.5 rounded-lg">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files List / Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Knowledge Base Documents ({files.length})
        </h3>

        {files.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-panel border border-white/10 space-y-3">
            <UploadCloud className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="font-semibold text-slate-300">No documents indexed yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload PDFs, CSVs, documentation, or code files. ZENO will automatically extract and index content for instant retrieval in chat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={`p-4 rounded-2xl glass-card border text-left cursor-pointer transition flex flex-col justify-between
                  ${selectedFile?.id === file.id
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10 hover:border-white/20'
                  }
                `}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      {getFileIcon(file.mime_type, file.original_name)}
                    </div>
                    <button
                      onClick={e => handleDelete(file.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-slate-100 truncate" title={file.original_name}>
                      {file.original_name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>{(file.size_bytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Indexed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleAskAboutFile(file);
                    }}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask ZENO</span>
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(file.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected File Details Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-base truncate max-w-md">
                    {selectedFile.original_name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedFile.mime_type} • {(selectedFile.size_bytes / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-white px-2 py-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Extracted Text Intelligence
              </span>
              <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-300 overflow-y-auto max-h-60 whitespace-pre-wrap leading-relaxed">
                {selectedFile.preview || 'Text indexing active.'}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  handleAskAboutFile(selectedFile);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-medium hover:bg-cyan-500/30 transition flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discuss in Chat</span>
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
