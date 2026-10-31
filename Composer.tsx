import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  Globe,
  Mic,
  MicOff,
  Image as ImageIcon,
  Film,
  Code2,
  X,
  FileText,
  Sparkles,
  Loader2,
  Upload
} from 'lucide-react';
import { Attachment, AIMode } from '../../types';
import { apiFetch } from '../../lib/api';

interface ComposerProps {
  onSendMessage: (content: string, attachments: Attachment[], webSearch: boolean, clientLocation?: { latitude: number; longitude: number } | null) => void;
  disabled?: boolean;
  currentMode: AIMode;
  onSetMode: (mode: AIMode) => void;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  disabled = false,
  currentMode,
  onSetMode
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [webSearch, setWebSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');
  const finalTranscriptRef = useRef('');
  const lastPasteTimeRef = useRef<number>(0);
  const recentUploadsRef = useRef<Map<string, number>>(new Map());
  const isUploadingRef = useRef<boolean>(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [content]);

  // Handle Speech Recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      baseTextRef.current = content;
      finalTranscriptRef.current = '';

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + event.results[i][0].transcript.trim();
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const combined = [
          baseTextRef.current.trim(),
          finalTranscriptRef.current.trim(),
          interim.trim()
        ].filter(Boolean).join(' ');
        setContent(combined);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsRecording(false);
    }
  };

  // Upload a list of files (from file input, clipboard paste, or drag-and-drop)
  const uploadFileList = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const now = Date.now();
    // Clean expired entries older than 8 seconds from deduplication cache
    for (const [sig, timestamp] of recentUploadsRef.current.entries()) {
      if (now - timestamp > 8000) {
        recentUploadsRef.current.delete(sig);
      }
    }

    const rawArray = Array.from(files);
    const fileArray: File[] = [];

    // Filter out duplicate files in the input itself, against active attachments, and against recent uploads
    for (const file of rawArray) {
      const sig = `${file.name}_${file.size}_${file.lastModified || 0}`;
      const alreadyAttached = attachments.some(
        att => att.name === file.name && att.file_size === file.size
      );
      if (recentUploadsRef.current.has(sig) || alreadyAttached) {
        continue;
      }
      recentUploadsRef.current.set(sig, now);
      fileArray.push(file);
    }

    if (fileArray.length === 0) return;

    setIsUploading(true);
    isUploadingRef.current = true;

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append('file', file);

      // Create instant local preview URL for images and videos
      let localPreview: string | undefined = undefined;
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        try {
          localPreview = URL.createObjectURL(file);
        } catch {}
      }

      try {
        const res = await apiFetch('/api/files/upload', {
          method: 'POST',
          body: formData
        });

        if (res.file) {
          const originalName = res.file.original_name || file.name;
          const sizeBytes = res.file.size_bytes || file.size;
          const storedName = res.file.stored_name;

          setAttachments(prev => {
            // Strict guard against duplicate insertion
            const exists = prev.some(
              p => (p.name === originalName && p.file_size === sizeBytes) ||
                   (storedName && p.file_path === storedName)
            );
            if (exists) {
              return prev;
            }
            return [
              ...prev,
              {
                name: originalName,
                file_type: res.file.mime_type || file.type,
                file_size: sizeBytes,
                file_path: storedName,
                preview_url: localPreview || (storedName ? `/uploads/${storedName}` : undefined)
              }
            ];
          });
        }
      } catch (err) {
        console.error('File upload failed for', file.name, err);
      }
    }
    setIsUploading(false);
    isUploadingRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle File Input Dialog
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await uploadFileList(e.target.files);
    }
  };

  // Handle Clipboard Copy & Paste (Images, Screenshots, Videos, Files)
  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // Throttle / debounce rapid duplicate paste events (1 second minimum interval)
    const now = Date.now();
    if (now - lastPasteTimeRef.current < 1000) {
      e.stopPropagation();
      return;
    }

    const rawFiles: File[] = [];

    // 1. Check clipboard files (files copied from File Explorer, Desktop, or Browser)
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        rawFiles.push(clipboardData.files[i]);
      }
    } else if (clipboardData.items && clipboardData.items.length > 0) {
      // 2. Check clipboard items (e.g., screenshots taken with Snipping Tool, Win+Shift+S, PrintScreen)
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            const renamedFile = file.name === 'image.png'
              ? new File([file], `Pasted-Image-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`, { type: file.type })
              : file;
            rawFiles.push(renamedFile);
          }
        }
      }
    }

    if (rawFiles.length === 0) return;

    // Deduplicate within the clipboard payload itself
    const seenSigs = new Set<string>();
    const filesToUpload: File[] = [];
    for (const f of rawFiles) {
      const sig = `${f.name}_${f.size}`;
      if (!seenSigs.has(sig)) {
        seenSigs.add(sig);
        filesToUpload.push(f);
      }
    }

    if (filesToUpload.length > 0) {
      lastPasteTimeRef.current = now;
      e.preventDefault();
      e.stopPropagation();
      uploadFileList(filesToUpload);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFileList(e.dataTransfer.files);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!content.trim() && attachments.length === 0) || disabled || isUploading) return;
    onSendMessage(content.trim(), attachments, webSearch, null);
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      <div
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl glass-panel-elevated p-2.5 border transition-all duration-200 shadow-2xl focus-within:border-cyan-500/50 ${
          isDragging ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-cyan-950/20' : 'border-white/15'
        }`}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-30 rounded-2xl bg-slate-950/90 backdrop-blur-md border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center gap-2.5 text-cyan-200 pointer-events-none transition-all">
            <Upload className="w-8 h-8 text-cyan-400 animate-bounce" />
            <span className="text-sm font-semibold tracking-wide text-cyan-100">Drop images, videos, or documents to attach</span>
            <span className="text-xs text-cyan-300/70">Supports PNG, JPG, WEBP, MP4, WebM, PDF, Code, & all files up to 100MB</span>
          </div>
        )}

        {/* Attachment Preview Chips & Uploading Indicator */}
        {(attachments.length > 0 || isUploading) && (
          <div className="flex flex-wrap items-center gap-2 px-2 pt-1 pb-2 border-b border-white/10 mb-2">
            {attachments.map((att, idx) => {
              const isImg = att.file_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(att.name);
              const isVid = att.file_type?.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(att.name);
              const previewSrc = att.preview_url || (att.file_path ? `/uploads/${att.file_path}` : '');

              const formatSize = (bytes?: number) => {
                if (!bytes) return '';
                if (bytes < 1024) return `${bytes} B`;
                if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
              };

              return (
                <div
                  key={idx}
                  className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 text-xs text-slate-200 shadow-md hover:border-cyan-500/40 transition"
                >
                  {isImg && previewSrc ? (
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/15 shrink-0 bg-black/60">
                      <img
                        src={previewSrc}
                        alt={att.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : isVid ? (
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center shrink-0">
                      <Film className="w-4 h-4 text-indigo-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-cyan-400" />
                    </div>
                  )}

                  <div className="flex flex-col min-w-0 max-w-[150px]">
                    <span className="truncate font-medium text-slate-200 text-xs">{att.name}</span>
                    {att.file_size ? (
                      <span className="text-[10px] text-slate-400 font-mono">{formatSize(att.file_size)}</span>
                    ) : null}
                  </div>

                  <button
                    onClick={() => removeAttachment(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition ml-0.5"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* In-Flight Uploading Badge */}
            {isUploading && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-xs text-cyan-300 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Processing & attaching media...</span>
              </div>
            )}
          </div>
        )}

        {/* Input Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask ZENO anything, paste images/videos/documents, research, or generate code..."
          disabled={disabled}
          rows={1}
          className="w-full px-3 py-1.5 bg-transparent text-sm md:text-base text-slate-100 placeholder-slate-500 resize-none focus:outline-none max-h-44 leading-relaxed"
        />

        {/* Action Controls Toolbar */}
        <div className="flex items-center justify-between pt-2 px-1">
          {/* Left Buttons: Attachments & Mode Toggles */}
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Attach images, videos, documents or code (Ctrl+V paste supported)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search Toggle */}
            <button
              onClick={() => setWebSearch(!webSearch)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition
                ${webSearch
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
                }
              `}
              title={webSearch ? 'Live Web Search Active (Tavily AI)' : 'Toggle Live Web Search (Tavily AI)'}
            >
              <Globe className={`w-3.5 h-3.5 ${webSearch ? 'text-cyan-300 animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Search</span>
              {webSearch && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping ml-0.5" />
              )}
            </button>

            {/* Quick Code Mode Toggle */}
            <button
              onClick={() => onSetMode(currentMode === 'code' ? 'chat' : 'code')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition
                ${currentMode === 'code'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
                }
              `}
              title="Toggle Code Mode"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Code</span>
            </button>

            {/* Voice Dictation */}
            <button
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-xl transition ${isRecording ? 'text-cyan-400 bg-cyan-500/20 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
              title={isRecording ? 'Listening... click to stop' : 'Voice input (Speech to text)'}
            >
              {isRecording ? <MicOff className="w-4 h-4 text-cyan-400" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Button: Send Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={(!content.trim() && attachments.length === 0) || disabled || isUploading}
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 shadow-md
                ${content.trim() || attachments.length > 0
                  ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white hover:shadow-cyan-500/30 hover:scale-105 active:scale-95'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed'
                }
              `}
              title="Send message (Enter)"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
