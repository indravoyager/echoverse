import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, RotateCcw, FileAudio, Settings2, Image as ImageIcon, Save, CheckCircle2, Play, Pause, Music, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import * as jsmediatags from 'jsmediatags';
import { ID3Writer } from 'browser-id3-writer';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === undefined) return '00:00.00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function AudioMetadataApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationRaw, setDurationRaw] = useState(0);
  const audioRef = useRef(null);

  // Metadata state
  const [metadata, setMetadata] = useState({
    filename: '',
    title: '',
    artist: '',
    album: '',
    year: '',
    genre: '',
    track: '',
    coverUrl: null,
    coverBuffer: null,
    coverType: 'image/jpeg'
  });

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (metadata.coverUrl && metadata.coverUrl.startsWith('blob:')) {
        URL.revokeObjectURL(metadata.coverUrl);
      }
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('audio/')) {
      processFile(file);
    } else {
      alert('Please drop a valid audio file (MP3 recommended).');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
    e.target.value = null;
  };

  const processFile = (file) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (metadata.coverUrl && metadata.coverUrl.startsWith('blob:')) {
      URL.revokeObjectURL(metadata.coverUrl);
    }

    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setIsPlaying(false);
    setCurrentTime(0);
    setDurationRaw(0);

    // Read tags
    jsmediatags.read(file, {
      onSuccess: (tag) => {
        const tags = tag.tags;
        let coverUrl = null;
        let coverBuffer = null;
        let coverType = 'image/jpeg';

        if (tags.picture) {
          const { data, format } = tags.picture;
          const byteArray = new Uint8Array(data);
          const blob = new Blob([byteArray], { type: format });
          coverUrl = URL.createObjectURL(blob);
          coverBuffer = byteArray.buffer;
          coverType = format;
        }

        setMetadata({
          filename: file.name.replace(/\.[^/.]+$/, ""),
          title: tags.title || '',
          artist: tags.artist || '',
          album: tags.album || '',
          year: tags.year || '',
          genre: tags.genre || '',
          track: tags.track ? String(tags.track).split('/')[0] : '', // Extract track number
          coverUrl,
          coverBuffer,
          coverType
        });
      },
      onError: (error) => {
        console.error('Error reading tags:', error);
        setMetadata({
          filename: '', title: '', artist: '', album: '', year: '', genre: '', track: '', coverUrl: null, coverBuffer: null, coverType: 'image/jpeg'
        });
      }
    });
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        const blob = new Blob([arrayBuffer], { type: file.type });

        if (metadata.coverUrl && metadata.coverUrl.startsWith('blob:')) {
          URL.revokeObjectURL(metadata.coverUrl);
        }

        setMetadata(prev => ({
          ...prev,
          coverBuffer: arrayBuffer,
          coverUrl: URL.createObjectURL(blob),
          coverType: file.type
        }));
      };
      reader.readAsArrayBuffer(file);
    }
    e.target.value = null;
  };

  const handleSave = async () => {
    if (!audioFile) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const writer = new ID3Writer(arrayBuffer);

      if (metadata.title) writer.setFrame('TIT2', metadata.title);
      if (metadata.artist) writer.setFrame('TPE1', [metadata.artist]);
      if (metadata.album) writer.setFrame('TALB', metadata.album);
      if (metadata.year) writer.setFrame('TYER', parseInt(metadata.year, 10));
      if (metadata.genre) writer.setFrame('TCON', [metadata.genre]);
      if (metadata.track) writer.setFrame('TRCK', metadata.track);

      if (metadata.coverBuffer) {
        writer.setFrame('APIC', {
          type: 3,
          data: metadata.coverBuffer,
          description: 'Cover',
          useUnicodeEncoding: false
        });
      }

      writer.addTag();
      const blob = writer.getBlob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const extMatch = audioFile.name.match(/\.[^/.]+$/);
      const ext = extMatch ? extMatch[0] : '.mp3';
      const outName = metadata.filename ? metadata.filename.trim() : audioFile.name.replace(ext, '');
      link.download = `${outName}${ext}`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error saving metadata. Note: ID3 editing works best with MP3 files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (metadata.coverUrl && metadata.coverUrl.startsWith('blob:')) {
      URL.revokeObjectURL(metadata.coverUrl);
    }
    setAudioFile(null);
    setAudioUrl(null);
    setIsProcessing(false);
    setIsPlaying(false);
    setMetadata({
      filename: '', title: '', artist: '', album: '', year: '', genre: '', track: '', coverUrl: null, coverBuffer: null, coverType: 'image/jpeg'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  // Player controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch(error => {
            console.error("Playback failed:", error);
            setIsPlaying(false);
            alert("This audio format cannot be previewed in your browser, but you can still edit and export its metadata.");
          });
        } else {
          setIsPlaying(true);
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDurationRaw(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = percent * durationRaw;
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Standard Echo ATURAI Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />

      {/* Tool Header */}
      <div className="h-[60px] px-6 md:px-8 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0 z-20 relative w-full overflow-hidden">
        <div className="flex items-center space-x-3 md:space-x-4 shrink-0 min-w-0 pr-4">
          <button onClick={onOpenSidebar} className="sm:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <img
            src={persona.avatar}
            alt={persona.name}
            onClick={onOpenPersonaInfo}
            className="w-9 h-9 rounded-full border bg-white dark:bg-[#030303] object-cover scale-110 shrink-0 cursor-pointer hover:scale-125 transition-transform"
            style={{
              borderColor: `color-mix(in srgb, ${persona.theme.primary} 50%, transparent)`
            }}
          />
          <div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
            <h2 className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-1.5 min-w-0">
              <span className="truncate">{persona.name}</span>
              {persona.isOnDevice && <Leaf size={16} className="text-green-500 fill-green-500/20 shrink-0" />}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span className="-translate-y-[1px]">On-Device</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
          style={{
            '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
            '--btn-hover-text': persona.theme.primary
          }}
          title="Reset Workspace"
        >
          <RotateCcw size={18} />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full">

          {/* Settings Sidebar (Left) */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">

            {/* Configuration Panel */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Configuration
                </h3>
              </div>

              <div className="p-4 flex flex-col gap-4 flex-1">
                {[
                  { label: 'File Name', name: 'filename', type: 'text', placeholder: 'Output File Name' },
                  { label: 'Title', name: 'title', type: 'text', placeholder: 'Song Title' },
                  { label: 'Artist', name: 'artist', type: 'text', placeholder: 'Artist Name' },
                  { label: 'Album', name: 'album', type: 'text', placeholder: 'Album Name' }
                ].map(field => (
                  <div key={field.name}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">{field.label}</label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={metadata[field.name]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      disabled={!audioFile}
                      className="w-full h-[34px] bg-slate-100 dark:bg-white/5 border border-transparent rounded-lg px-3 text-[13px] text-slate-800 dark:text-white focus:outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all disabled:opacity-50 placeholder-slate-400"
                      style={{ '--color-primary': persona.theme.primary }}
                    />
                  </div>
                ))}

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Year</label>
                    <input
                      type="text"
                      name="year"
                      value={metadata.year}
                      onChange={handleInputChange}
                      placeholder="YYYY"
                      disabled={!audioFile}
                      className="w-full h-[34px] bg-slate-100 dark:bg-white/5 border border-transparent rounded-lg px-3 text-[13px] text-slate-800 dark:text-white focus:outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all disabled:opacity-50 placeholder-slate-400"
                      style={{ '--color-primary': persona.theme.primary }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Track</label>
                    <input
                      type="text"
                      name="track"
                      value={metadata.track}
                      onChange={handleInputChange}
                      placeholder="1"
                      disabled={!audioFile}
                      className="w-full h-[34px] bg-slate-100 dark:bg-white/5 border border-transparent rounded-lg px-3 text-[13px] text-slate-800 dark:text-white focus:outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all disabled:opacity-50 placeholder-slate-400"
                      style={{ '--color-primary': persona.theme.primary }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Genre</label>
                  <input
                    type="text"
                    name="genre"
                    value={metadata.genre}
                    onChange={handleInputChange}
                    placeholder="Pop, Rock, etc."
                    disabled={!audioFile}
                    className="w-full h-[34px] bg-slate-100 dark:bg-white/5 border border-transparent rounded-lg px-3 text-[13px] text-slate-800 dark:text-white focus:outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all disabled:opacity-50 placeholder-slate-400"
                    style={{ '--color-primary': persona.theme.primary }}
                  />
                </div>
              </div>
            </div>

            {/* Track Details Panel */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Track Details
                </h3>
              </div>

              <div className="p-3.5 flex flex-col">
                <div className="grid grid-cols-2 gap-2 mb-3.5">
                  <div className="bg-slate-50 dark:bg-[#0a0a0a]/50 rounded-lg p-2.5 flex flex-col justify-center border border-slate-100 dark:border-white/5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">File Size</span>
                    <span className="text-2xl font-black leading-none tracking-tight text-slate-700 dark:text-slate-200">
                      {audioFile ? formatSize(audioFile.size) : '0'}
                    </span>
                  </div>
                  <div className="bg-[var(--color-primary)]/10 rounded-lg p-2.5 flex flex-col justify-center" style={{ '--color-primary': persona.theme.primary }}>
                    <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-widest mb-1">Total Duration</span>
                    <span className="text-[17px] font-black text-[var(--color-primary)] leading-none tracking-tight break-all">
                      {formatTime(durationRaw)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3.5">
                  <button
                    onClick={togglePlay}
                    disabled={!audioFile}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 hover:opacity-90 active:scale-95"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
                      color: persona.theme.primary
                    }}
                  >
                    {isPlaying ? <Pause size={13} className="fill-current" /> : <Play size={13} className="fill-current" />}
                    {isPlaying ? 'Pause' : 'Preview'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!audioFile || isProcessing}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-white font-bold text-[10px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest disabled:opacity-50 active:scale-95"
                    style={{ backgroundColor: persona.theme.primary }}
                  >
                    <Download size={13} />
                    {isProcessing ? 'Wait' : 'Export'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Area (Right) */}
          <div className="flex-1 flex flex-col gap-4 min-h-[400px]">
            <div
              className={clsx(
                "w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300 bg-white/50 dark:bg-black/20 relative",
                audioFile ? "py-8" : "flex-1 p-8",
                isDragging
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 scale-[0.99]"
                  : "border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5"
              )}
              style={{ '--color-brand-primary': persona.theme.primary }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />

              {!audioFile ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 text-slate-400">
                    <FileAudio size={32} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
                    Drop your Audio files here
                  </h3>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                    Upload MP3 or WAV to edit their ID3 metadata tags entirely offline.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-xl font-bold text-[13px] transition-all bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white active:scale-95"
                  >
                    Browse Audio
                  </button>
                </>
              ) : (
                <>
                  <div className="w-full max-w-2xl px-4 flex flex-col items-center">

                    {/* Cover Art Upload Area */}
                    <div
                      className="w-48 h-48 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden mb-6 relative group cursor-pointer"
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {metadata.coverUrl ? (
                        <img src={metadata.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-300 dark:text-slate-600">
                          <ImageIcon className="w-10 h-10 mb-2" />
                          <span className="text-xs font-medium">Add Cover</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <UploadCloud className="w-8 h-8 mb-1" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Change</span>
                      </div>
                    </div>
                    <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />

                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />

                    {/* Progress Bar (Standard style) */}
                    <div className="w-full max-w-md flex items-center gap-3 text-xs font-medium text-slate-500 bg-white dark:bg-[#1a1a1a] p-3 rounded-lg border border-slate-200 dark:border-white/10">
                      <span className="w-10 text-right">{formatTime(currentTime)}</span>
                      <div
                        className="flex-1 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
                        onClick={handleSeek}
                      >
                        <div
                          className="absolute top-0 left-0 h-full transition-all duration-100 rounded-full"
                          style={{ width: `${durationRaw ? (currentTime / durationRaw) * 100 : 0}%`, backgroundColor: persona.theme.primary }}
                        />
                      </div>
                      <span className="w-10">{formatTime(durationRaw)}</span>
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-6 px-6 h-8 flex items-center justify-center gap-1.5 text-white font-bold text-[10px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95"
                      style={{ backgroundColor: persona.theme.primary }}
                    >
                      Replace File
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
