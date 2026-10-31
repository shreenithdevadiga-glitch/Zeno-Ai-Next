import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  MessageSquare,
  FileText,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Project } from '../types';
import { apiFetch } from '../lib/api';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [color, setColor] = useState('#06b6d4');

  const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

  const loadProjects = async () => {
    try {
      const data = await apiFetch('/api/projects');
      setProjects(data.projects || []);
    } catch (err) {
      console.warn('Could not load projects:', err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim(), systemPrompt: systemPrompt.trim(), color })
      });
      setName('');
      setDescription('');
      setSystemPrompt('');
      setIsModalOpen(false);
      loadProjects();
    } catch (err) {
      console.error('Project creation error:', err);
    }
  };

  const handleDelete = async (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Archive this project workspace?')) return;
    try {
      await apiFetch(`/api/projects/${projId}`, { method: 'DELETE' });
      loadProjects();
    } catch {}
  };

  const handleOpenProjectChat = (proj: Project) => {
    navigate('/app/chat', {
      state: {
        projectId: proj.id,
        initialPrompt: `I am working within project "${proj.name}". System guidelines: ${proj.system_prompt}`
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-cyan-400" />
            <span>Project Workspaces</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolate domain context, custom instructions, knowledge documents, and chats for each venture
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(proj => (
          <div
            key={proj.id}
            onClick={() => handleOpenProjectChat(proj)}
            className="p-5 rounded-2xl glass-card border border-white/10 hover:border-cyan-500/40 text-left cursor-pointer transition flex flex-col justify-between group shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md"
                  style={{ backgroundColor: proj.color || '#06b6d4' }}
                >
                  {proj.name[0].toUpperCase()}
                </div>
                <button
                  onClick={e => handleDelete(proj.id, e)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition truncate">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {proj.description || 'Dedicated workspace with isolated instructions and resources.'}
                </p>
              </div>

              {proj.system_prompt && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-300 line-clamp-2">
                  Prompt: {proj.system_prompt}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  {proj.chatCount || 0} chats
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  {proj.fileCount || 0} files
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base">
                Create Project Workspace
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white px-2 py-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Next-Gen Mobile App Architecture"
                  className="w-full p-2.5 rounded-xl glass-input text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Engineering specs, API design, and UI wireframes"
                  className="w-full p-2.5 rounded-xl glass-input text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  System Instructions (Context Isolation)
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  placeholder="e.g. You are the lead mobile architect. Always use clean architecture and TypeScript with reactive patterns."
                  rows={3}
                  className="w-full p-2.5 rounded-xl glass-input text-xs text-white focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Workspace Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-xl transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="px-5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-medium hover:bg-cyan-500/30 transition disabled:opacity-50"
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
