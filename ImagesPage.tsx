import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Share2,
  Trash2,
  MessageSquare,
  Wand2,
  AlertCircle
} from 'lucide-react';
import { GeneratedImage } from '../types';
import { apiFetch } from '../lib/api';
import { ZenoOrb } from '../components/ZenoOrb';

export const ImagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('vivid');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const styles = [
    { id: 'vivid', label: 'Vivid Dynamic', desc: 'Vibrant RGB lighting, hyper-detailed 8K' },
    { id: 'cinematic', label: 'Cinematic 35mm', desc: 'Volumetric atmospheric lighting, photorealistic' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon', desc: 'Futuristic metropolis, holographic reflections' },
    { id: 'anime', label: 'Modern Anime', desc: 'Makoto Shinkai aesthetic, pristine details' },
    { id: '3d-render', label: 'Octane 3D', desc: 'Ray-traced glossy reflections and depth' }
  ];

  const aspectRatios = [
    { id: '1:1', label: 'Square (1:1)' },
    { id: '16:9', label: 'Landscape (16:9)' },
    { id: '9:16', label: 'Portrait (9:16)' },
    { id: '4:3', label: 'Standard (4:3)' }
  ];

  const loadImages = async () => {
    try {
      const data = await apiFetch('/api/images');
      setImages(data.images || []);
    } catch (err) {
      console.warn('Could not load images:', err);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await apiFetch('/api/images/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          aspectRatio
        })
      });

      setImages(prev => [res.image, ...prev]);
      setPrompt('');
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || 'Generation failed. Configure an image provider in Settings.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this generated image?')) return;
    try {
      await apiFetch(`/api/images/${imageId}`, { method: 'DELETE' });
      setImages(prev => prev.filter(img => img.id !== imageId));
      if (selectedImage?.id === imageId) setSelectedImage(null);
    } catch {}
  };

  const handleUseInChat = (img: GeneratedImage) => {
    navigate('/app/chat', {
      state: {
        initialPrompt: `Please inspect this generated image (${img.prompt}) and help me iterate on its concept.`
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-pink-400" />
          <span>Generative Image Studio</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Generate cinematic visual concept art, high-precision renders, and illustrations with prompt tuning
        </p>
      </div>

      {/* Creation Console */}
      <div className="rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Image Prompt Description
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., A cinematic wide angle shot of a futuristic neural quantum laboratory with glowing RGB energy conduits and sleek glass surfaces..."
              rows={3}
              disabled={isGenerating}
              className="w-full p-4 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Controls: Style & Aspect Ratio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Aesthetic Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {styles.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition text-left
                    ${style === s.id
                      ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }
                  `}
                >
                  <div className="font-semibold">{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {aspectRatios.map(ar => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition text-center
                    ${aspectRatio === ar.id
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }
                  `}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className={`w-full py-3.5 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg
            ${prompt.trim() && !isGenerating
              ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white hover:shadow-pink-500/25 hover:scale-[1.01]'
              : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {isGenerating ? (
            <>
              <ZenoOrb size="sm" state="thinking" />
              <span>Synthesizing visual render with diffusion pipeline...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 text-pink-300" />
              <span>Generate Image</span>
            </>
          )}
        </button>
      </div>

      {/* Gallery */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Generated Gallery ({images.length})
        </h3>

        {images.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-panel border border-white/10 space-y-3">
            <ImageIcon className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="font-semibold text-slate-300">No artwork synthesized yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Describe any concept above to generate ultra-high-definition artwork with dynamic lighting and tailored aspect ratios.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map(img => (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="group relative rounded-2xl glass-panel border border-white/10 overflow-hidden cursor-pointer hover:border-pink-500/40 transition shadow-lg"
              >
                <div className="aspect-square w-full overflow-hidden bg-black/50 relative">
                  <img
                    src={img.image_url}
                    alt={img.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-xs text-white line-clamp-2 leading-relaxed">
                      {img.prompt}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 text-white font-mono uppercase">
                        {img.style}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 text-white font-mono">
                        {img.aspect_ratio}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between bg-black/40 border-t border-white/5">
                  <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {img.prompt}
                  </span>
                  <div className="flex items-center gap-1">
                    <a
                      href={img.image_url}
                      download={`zeno-art-${img.id}.jpg`}
                      onClick={e => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                      title="Download image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={e => handleDelete(img.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-4xl w-full rounded-2xl glass-panel-elevated overflow-hidden border border-white/15">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white truncate max-w-lg">
                {selectedImage.prompt}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-white px-2 py-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/60 max-h-[70vh]">
              <img
                src={selectedImage.image_url}
                alt={selectedImage.prompt}
                className="max-h-[65vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
              <div className="text-xs text-slate-400 font-mono">
                Model: {selectedImage.model} • Style: {selectedImage.style} • {selectedImage.width}x{selectedImage.height}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleUseInChat(selectedImage);
                    setSelectedImage(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-medium hover:bg-cyan-500/30 transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discuss in Chat</span>
                </button>
                <a
                  href={selectedImage.image_url}
                  download={`zeno-${selectedImage.id}.jpg`}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
