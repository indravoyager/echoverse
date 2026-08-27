import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, Settings2, Loader2, RotateCcw, Music, Play, Pause, Scissors, Repeat, X, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';

// --- WAV Encoder Helper ---
function encodeWAV(samples, sampleRate, numChannels) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function stripID3v2(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength < 10) return arrayBuffer;
  const view = new DataView(arrayBuffer);
  if (view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
    const flags = view.getUint8(5);
    const size = ((view.getUint8(6) & 0x7f) << 21) |
                 ((view.getUint8(7) & 0x7f) << 14) |
                 ((view.getUint8(8) & 0x7f) << 7)  |
                  (view.getUint8(9) & 0x7f);
    let headerSize = 10 + size;
    if ((flags & 0x10) !== 0) {
      headerSize += 10; // ID3v2 10-byte footer present
    }
    if (headerSize > 0 && headerSize < arrayBuffer.byteLength) {
      return arrayBuffer.slice(headerSize);
    }
  }
  return arrayBuffer;
}

const formatTime = (seconds) => {
  if (!isFinite(seconds) || seconds < 0 || seconds === undefined) return '00:00.00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const floatTo16BitPCM = (input) => {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
};

// --- Audio Track Component ---
function AudioTrack({ fileObj, index, onUpdate, onRemove, onExport, currentlyPlayingId, onPlayChange, onFinish, persona, scriptsLoaded }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    if (currentlyPlayingId !== fileObj.id && isPlaying && wavesurferRef.current) {
      wavesurferRef.current.pause();
    }
    
    if (currentlyPlayingId === fileObj.id && !isPlaying && wavesurferRef.current) {
        const region = regionsPluginRef.current?.getRegions()[0];
        try {
          if (region) {
            region.play();
          } else {
            wavesurferRef.current.play().catch(e => console.error("Play error:", e));
          }
        } catch (err) {
          console.error("Playback failed:", err);
        }
    }
  }, [currentlyPlayingId, fileObj.id, isPlaying]);

  useEffect(() => {
    if (!containerRef.current) return;

    let isCancelled = false;
    let createdObjectURL = null;

    const initWaveSurfer = async () => {
      try {
        const buffer = await fileObj.file.arrayBuffer();
        const cleanBuffer = stripID3v2(buffer);
        const cleanBlob = new Blob([cleanBuffer], { type: fileObj.file.type || 'audio/mpeg' });
        createdObjectURL = URL.createObjectURL(cleanBlob);

        if (isCancelled) return;

        const ws = WaveSurfer.create({
          container: containerRef.current,
          url: createdObjectURL,
          waveColor: `color-mix(in srgb, ${persona.theme.primary} 40%, transparent)`,
          progressColor: persona.theme.primary,
          cursorColor: persona.theme.secondary,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 70,
          normalize: true,
        });

        const regionsPlugin = ws.registerPlugin(RegionsPlugin.create());
        regionsPluginRef.current = regionsPlugin;

        ws.on('ready', () => {
          const audioDuration = ws.getDuration();
          
          if (fileObj.duration === 0) {
            onUpdate(fileObj.id, { duration: audioDuration, trimStart: 0, trimEnd: audioDuration });
          }

          regionsPlugin.addRegion({
            start: fileObj.trimStart || 0,
            end: fileObj.trimEnd || audioDuration,
            color: `color-mix(in srgb, ${persona.theme.primary} 20%, transparent)`,
            drag: true,
            resize: true,
          });

          regionsPlugin.on('region-updated', (region) => {
            onUpdate(fileObj.id, { trimStart: region.start, trimEnd: region.end });
          });
          regionsPlugin.on('region-out', (region) => {
            if (isLoopingRef.current) {
              region.play();
            } else {
              ws.pause();
              if (onFinishRef.current) onFinishRef.current(fileObj.id);
            }
          });
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => {
          setIsPlaying(false);
          if (isLoopingRef.current && !regionsPluginRef.current?.getRegions()[0]) {
            ws.play().catch(e => console.error("Play error:", e));
          } else {
            if (onFinishRef.current) onFinishRef.current(fileObj.id);
          }
        });

        ws.on('error', (err) => {
          console.warn("WaveSurfer load error:", err);
          alert(`Format file "${fileObj.name}" tidak dapat diputar.`);
          onRemove(fileObj.id);
        });

        wavesurferRef.current = ws;
      } catch (err) {
        console.error("Failed to read audio file:", err);
        alert(`Gagal membaca file "${fileObj.name}".`);
        onRemove(fileObj.id);
      }
    };

    initWaveSurfer();

    return () => {
      isCancelled = true;
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
      if (createdObjectURL) {
        URL.revokeObjectURL(createdObjectURL);
      }
    };
  }, [scriptsLoaded.wavesurfer, fileObj.id]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.pause();
        onPlayChange(null);
      } else {
        onPlayChange(fileObj.id);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in fade-in relative">
      <div className="h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center px-4 shrink-0">
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider truncate mr-4">
          <span className="opacity-50 mr-2">#{index + 1}</span>
          {fileObj.name}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onExport(fileObj.id)}
            className="text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg uppercase font-bold tracking-widest transition-all active:scale-95"
          >
            Export
          </button>
          <button 
            onClick={() => onRemove(fileObj.id)}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-1 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="p-3 bg-slate-50/50 dark:bg-black/20 flex gap-3 items-center">
        {/* Play Controls */}
        <div className="flex flex-col gap-2 shrink-0 w-9">
          <button 
            onClick={togglePlayPause}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all active:scale-95 transform-gpu"
            style={{ backgroundColor: persona.theme.primary }}
          >
            {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-[2px]" />}
          </button>
          <button 
            onClick={() => setIsLooping(!isLooping)}
            className={clsx(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 transform-gpu",
              isLooping 
                ? "bg-[var(--color-primary)] text-white" 
                : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/10"
            )}
            style={{ '--color-primary': persona.theme.primary }}
          >
            <Repeat size={16} />
          </button>
        </div>
        {/* Waveform Container */}
        <div className="flex-1 bg-white dark:bg-[#1a1a1a] p-2 rounded-lg border border-slate-200 dark:border-white/10 relative min-w-0">
          <div ref={containerRef} className="w-full h-[70px]" />
        </div>
      </div>
      <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a] flex justify-between text-[10px] font-bold text-slate-400">
        <span>START: {formatTime(fileObj.trimStart)}</span>
        <span>END: {formatTime(fileObj.trimEnd)}</span>
        <span style={{ color: persona.theme.primary }}>LEN: {formatTime(Math.max(0, fileObj.trimEnd - fileObj.trimStart))}</span>
      </div>
    </div>
  );
}

// --- Main App ---
export default function AudioStudioApp({ persona, onOpenSidebar, onOpenPersonaInfo, onUnsavedDataChange }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  
  useEffect(() => {
    if (isPlayingAll && currentlyPlayingId === null) {
      setIsPlayingAll(false);
    }
  }, [currentlyPlayingId, isPlayingAll]);

  const [targetFormat, setTargetFormat] = useState('mp3');
  const [scriptsLoaded, setScriptsLoaded] = useState({ wavesurfer: true, lamejs: false });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (onUnsavedDataChange) {
      onUnsavedDataChange(files.length > 0);
    }
  }, [files.length, onUnsavedDataChange]);

  useEffect(() => {
    // Load lamejs library dynamically for MP3 encoding
    const loadScript = (src, id) => {
      return new Promise((resolve, reject) => {
        let script = document.getElementById(id);
        if (script) {
          if (script.getAttribute('data-loaded') === 'true') {
            return resolve();
          } else {
            script.addEventListener('load', resolve);
            script.addEventListener('error', reject);
            return;
          }
        }
        script = document.createElement('script');
        script.src = src;
        script.id = id;
        script.onload = () => {
          script.setAttribute('data-loaded', 'true');
          resolve();
        };
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    loadScript('https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js', 'lamejs-script')
      .then(() => setScriptsLoaded(prev => ({ ...prev, lamejs: true })))
      .catch(err => console.error("Failed to load lamejs library", err));
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };


  const processFiles = (newFiles) => {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i.test(f.name));
    if (arr.length === 0) {
      alert("Silakan masukkan file audio yang valid (MP3, WAV, OGG, M4A, AAC, FLAC).");
      return;
    }
    const mapped = arr.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      trimStart: 0,
      trimEnd: 0,
      duration: 0
    }));
    setFiles(prev => [...prev, ...mapped]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileUpload = (e) => {
    processFiles(e.target.files);
    e.target.value = null;
  };

  const handleUpdateTrack = (id, updates) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleRemoveTrack = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const togglePlayAll = () => {
    if (isPlayingAll) {
      setIsPlayingAll(false);
      setCurrentlyPlayingId(null);
    } else {
      if (files.length === 0) return;
      setIsPlayingAll(true);
      setCurrentlyPlayingId(files[0].id);
    }
  };

  const handleTrackFinish = (finishedId) => {
    if (isPlayingAll) {
      const currentIndex = files.findIndex(f => f.id === finishedId);
      if (currentIndex >= 0 && currentIndex < files.length - 1) {
        setCurrentlyPlayingId(files[currentIndex + 1].id);
      } else {
        setIsPlayingAll(false);
        setCurrentlyPlayingId(null);
      }
    } else {
      if (currentlyPlayingId === finishedId) {
        setCurrentlyPlayingId(null);
      }
    }
  };

  const totalMergedDuration = files.reduce((acc, f) => acc + Math.max(0, f.trimEnd - f.trimStart), 0);

  const processAudio = async (specificTrackId = null) => {
    const tracksToProcess = specificTrackId 
      ? files.filter(f => f.id === specificTrackId)
      : files;
      
    if (tracksToProcess.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Preparing merge engine...');

    let audioCtx = null;
    let actualTargetFormat = targetFormat;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const commonSampleRate = audioCtx.sampleRate;
      
      const fileDataList = [];
      let currentOffset = 0;

      // 1. Decode Audio
      for (let i = 0; i < tracksToProcess.length; i++) {
        const f = tracksToProcess[i];
        setStatusMessage(`Decoding track ${i + 1}/${tracksToProcess.length}...`);
        setProgress(Math.round(((i) / tracksToProcess.length) * 30));
        
        const arrayBuffer = await f.file.arrayBuffer();
        const cleanBuffer = stripID3v2(arrayBuffer);
        const decoded = await audioCtx.decodeAudioData(cleanBuffer);
        const startOffset = f.trimStart || 0;
        const trimmedDuration = Math.max(0, (f.trimEnd || f.duration) - startOffset);
        
        fileDataList.push({
          buffer: decoded,
          trimStart: startOffset,
          duration: trimmedDuration,
          offset: currentOffset
        });
        currentOffset += trimmedDuration;
      }

      setProgress(40);
      setStatusMessage('Rendering merged audio timeline...');

      if (currentOffset === 0) {
        throw new Error("Total duration is 0.");
      }

      // 2. Create Offline Context
      const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
        2, 
        Math.ceil(currentOffset * commonSampleRate),
        commonSampleRate
      );

      // 3. Schedule playback
      for (const data of fileDataList) {
        const source = offlineCtx.createBufferSource();
        source.buffer = data.buffer;
        source.connect(offlineCtx.destination);
        source.start(data.offset, data.trimStart, data.duration);
      }

      // 4. Render
      const renderedBuffer = await offlineCtx.startRendering();

      setProgress(70);

      // 5. Encode to format
      let resultBlob;

      if (actualTargetFormat === 'mp3' && (!window.lamejs || !window.lamejs.Mp3Encoder)) {
        console.warn("lamejs MP3 encoder module not loaded, falling back to WAV output.");
        actualTargetFormat = 'wav';
      }

      if (actualTargetFormat === 'wav') {
        setStatusMessage('Encoding to WAV...');
        let interleaved;
        if (renderedBuffer.numberOfChannels === 2) {
          const length = renderedBuffer.length;
          interleaved = new Float32Array(length * 2);
          const left = renderedBuffer.getChannelData(0);
          const right = renderedBuffer.getChannelData(1);
          for (let i = 0; i < length; i++) {
            interleaved[i*2] = left[i];
            interleaved[i*2+1] = right[i];
          }
        } else {
          interleaved = renderedBuffer.getChannelData(0);
        }
        resultBlob = encodeWAV(interleaved, commonSampleRate, renderedBuffer.numberOfChannels);
        setProgress(90);
      } else if (actualTargetFormat === 'mp3') {
        setStatusMessage('Encoding to MP3...');
        const numChannels = renderedBuffer.numberOfChannels;
        const mp3encoder = new window.lamejs.Mp3Encoder(numChannels, commonSampleRate, 128); // 128kbps

        let left, right;
        if (numChannels === 2) {
          left = floatTo16BitPCM(renderedBuffer.getChannelData(0));
          right = floatTo16BitPCM(renderedBuffer.getChannelData(1));
        } else {
          left = floatTo16BitPCM(renderedBuffer.getChannelData(0));
          right = left;
        }

        const sampleBlockSize = 1152 * 10;
        const mp3Data = [];

        for (let i = 0; i < left.length; i += sampleBlockSize) {
          const leftChunk = left.subarray(i, i + sampleBlockSize);
          const rightChunk = right.subarray(i, i + sampleBlockSize);
          const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
          if (i % (sampleBlockSize * 10) === 0) {
            setProgress(70 + Math.round((i / left.length) * 25));
            await new Promise(r => setTimeout(r, 0));
          }
        }

        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }

        resultBlob = new Blob(mp3Data, { type: 'audio/mp3' });
      }

      setProgress(100);
      setStatusMessage('Done!');

      // Download
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      const downloadName = specificTrackId ? tracksToProcess[0].name.replace(/\.[^/.]+$/, "") : `Merged_Audio_${new Date().getTime()}`;
      a.download = `${downloadName}.${actualTargetFormat}`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      alert('Error processing audio: ' + error.message);
    } finally {
      if (audioCtx && typeof audioCtx.close === 'function' && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
      setIsProcessing(false);
      setStatusMessage('');
      setProgress(0);
    }
  };

  const handleReset = () => {
    setFiles([]);
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />
      <style>{`
        /* Override WaveSurfer Regions handles for better mobile UX */
        ::part(region-handle) {
          width: 16px !important;
          background-color: ${persona.theme.primary} !important;
          opacity: 0.85 !important;
          border-radius: 4px !important;
          cursor: ew-resize !important;
          transition: width 0.2s, opacity 0.2s;
        }
        ::part(region-handle):active,
        ::part(region-handle):hover {
          width: 24px !important;
          opacity: 1 !important;
        }
        ::part(region-handle-left) {
          border-right: 2px solid rgba(255,255,255,0.4) !important;
        }
        ::part(region-handle-right) {
          border-left: 2px solid rgba(255,255,255,0.4) !important;
        }
      `}</style>
      {/* Header */}
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

      <div className="flex-1 overflow-y-auto relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full">
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Configuration
                </h3>

              </div>
              <div className="p-4 flex flex-col gap-4 flex-1">
                {/* Format Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Target Format</label>
                  <SegmentedControl
                    value={targetFormat}
                    onChange={setTargetFormat}
                    options={[
                      { value: 'mp3', label: 'mp3' },
                      { value: 'wav', label: 'wav' }
                    ]}
                  />
                  {/*
                    <div 
                      className="absolute top-1 bottom-1 bg-white dark:bg-[#2a2a2a] rounded-md transition-transform duration-300 ease-out"
                      style={{
                         width: `calc((100% - 8px) / 2)`,
                         transform: `translateX(calc(${['mp3', 'wav'].indexOf(targetFormat)} * 100%))`
                      }}
                    />
                    {['mp3', 'wav'].map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => setTargetFormat(fmt)}
                        className={clsx(
                          "flex-1 relative z-10 text-[11px] font-bold py-1.5 transition-colors duration-300 uppercase tracking-wider",
                          targetFormat === fmt ? "text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {fmt}
                      </button>
                    ))}
                  */}
                </div>

              </div>
            </div>

            {/* Merge Report Sidebar */}
            {/* Merge Report Sidebar */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Merge Report
                </h3>
              </div>
              <div className="p-3.5 flex flex-col">
                <div className="grid grid-cols-2 gap-2 mb-3.5">
                  <div className="bg-slate-50 dark:bg-[#0a0a0a]/50 rounded-lg p-2.5 flex flex-col justify-center border border-slate-100 dark:border-white/5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tracks</span>
                    <span className="text-2xl font-black leading-none tracking-tight text-slate-700 dark:text-slate-200">{files.length}</span>
                  </div>
                  <div className="bg-[var(--color-primary)]/10 rounded-lg p-2.5 flex flex-col justify-center" style={{ '--color-primary': persona.theme.primary }}>
                    <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-widest mb-1">Total Duration</span>
                    <span className="text-[17px] font-black text-[var(--color-primary)] leading-none tracking-tight break-all">{formatTime(totalMergedDuration)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayAll}
                    disabled={files.length === 0 || isProcessing}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 hover:opacity-90 active:scale-95"
                    style={{ 
                      backgroundColor: isPlayingAll ? `color-mix(in srgb, ${persona.theme.primary} 20%, transparent)` : `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
                      color: persona.theme.primary
                    }}
                  >
                    {isPlayingAll ? <Pause size={13} className="fill-current" /> : <Play size={13} className="fill-current" />}
                    {isPlayingAll ? 'Stop' : 'Play All'}
                  </button>
                  <button 
                    onClick={() => processAudio()}
                    disabled={files.length === 0 || isProcessing || !scriptsLoaded.lamejs}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-white font-bold text-[10px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest disabled:opacity-50 active:scale-95"
                    style={{ backgroundColor: persona.theme.primary }}
                  >
                    {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    {isProcessing ? 'Wait' : 'Export'}
                  </button>
                </div>

                {isProcessing && (
                  <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      <span>{statusMessage}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{ width: `${progress}%`, backgroundColor: persona.theme.primary }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col gap-4 min-h-[400px]">
            {/* Tracks List */}
            {files.map((fileObj, idx) => (
              <AudioTrack 
                key={fileObj.id} 
                index={idx}
                fileObj={fileObj} 
                onUpdate={handleUpdateTrack}
                onRemove={handleRemoveTrack}
                onExport={(id) => processAudio(id)}
                currentlyPlayingId={currentlyPlayingId}
                onPlayChange={setCurrentlyPlayingId}
                onFinish={handleTrackFinish}
                persona={persona}
                scriptsLoaded={scriptsLoaded}
              />
            ))}

            {/* Dropzone */}
            <div 
              className={clsx(
                "w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300 bg-white/50 dark:bg-black/20 relative",
                files.length > 0 ? "py-8" : "flex-1 p-8",
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
                multiple
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 text-slate-400">
                <Music size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
                {files.length > 0 ? "Add more tracks to merge" : "Drop your Audio files here"}
              </h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                Upload MP3, FLAC, WAV, AAC, or OGG to trim visually and merge them entirely offline.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 rounded-xl font-bold text-[13px] transition-all bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white active:scale-95"
              >
                Browse Audio
              </button>
            </div>

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-2xl">
                <div className="w-16 h-16 mb-4 relative flex items-center justify-center">
                  <svg className="animate-spin text-slate-200 dark:text-slate-700 w-full h-full" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill={persona.theme.primary} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold" style={{ color: persona.theme.primary }}>{progress}%</span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">{statusMessage}</h3>
                <p className="text-xs text-slate-500">Processing audio offline...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
