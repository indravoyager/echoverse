import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, Image as ImageIcon, RotateCcw, Settings2, Crop, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { clsx } from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';

const ASPECT_RATIOS = [
  { label: 'FREE', value: undefined },
  { label: '1:1', value: 1 },
  { label: '3:4', value: 3/4 },
  { label: '4:3', value: 4/3 },
  { label: '16:9', value: 16/9 },
  { label: '9:16', value: 9/16 }
];

const AspectIcon = ({ label, active, color }) => {
  let w = 16, h = 16;
  if (label === '3:4') { w = 12; h = 16; }
  else if (label === '4:3') { w = 16; h = 12; }
  else if (label === '16:9') { w = 20; h = 12; }
  else if (label === '9:16') { w = 12; h = 20; }
  
  if (label === 'FREE') {
    return (
      <div className="w-6 h-6 flex items-center justify-center">
        <div 
          className={clsx("w-4 h-4 border-[1.5px] border-dashed rounded-[2px] transition-colors", active ? "border-[var(--active-color)]" : "border-slate-400 dark:border-slate-500")}
          style={{ '--active-color': color }}
        />
      </div>
    );
  }

  return (
    <div className="w-6 h-6 flex items-center justify-center">
      <div 
        className={clsx("border-[1.5px] rounded-[2px] transition-colors", active ? "border-[var(--active-color)] bg-[var(--active-color)]/10" : "border-slate-400 dark:border-slate-500")}
        style={{ width: `${w}px`, height: `${h}px`, '--active-color': color }}
      />
    </div>
  );
};

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  if (!mediaWidth || !mediaHeight) return undefined;

  if (!aspect) {
    return centerCrop(
      { unit: 'px', width: mediaWidth * 0.9, height: mediaHeight * 0.9 },
      mediaWidth,
      mediaHeight
    );
  }

  const maxCropWidth = mediaWidth * 0.9;
  const maxCropHeight = mediaHeight * 0.9;

  let cropWidth = maxCropWidth;
  let cropHeight = cropWidth / aspect;

  if (cropHeight > maxCropHeight) {
    cropHeight = maxCropHeight;
    cropWidth = cropHeight * aspect;
  }

  return centerCrop(
    {
      unit: 'px',
      width: cropWidth,
      height: cropHeight,
    },
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropperApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [imageFile, setImageFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspectIndex, setAspectIndex] = useState(0);

  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

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
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      alert('Please drop a valid image file.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      setCrop(undefined); // reset crop
      setCompletedCrop(null);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    if (!width || !height) return;
    const currentAspect = ASPECT_RATIOS[aspectIndex].value;
    if (currentAspect) {
      setCrop(centerAspectCrop(width, height, currentAspect));
    } else {
      setCrop(undefined); // Free mode: let user draw manually
    }
  };

  // Update crop if aspect ratio changes
  useEffect(() => {
    const currentAspect = ASPECT_RATIOS[aspectIndex].value;
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      if (!width || !height) return;
      if (currentAspect) {
        setCrop(centerAspectCrop(width, height, currentAspect));
      } else {
        setCrop(undefined); // Free mode: reset selection
      }
    }
  }, [aspectIndex]);

  const handleReset = () => {
    setImageFile(null);
    setImageSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setAspectIndex(0);
  };

  const handleDownload = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width <= 0 || completedCrop.height <= 0) return;

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const pixelRatio = window.devicePixelRatio;
      
      canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const ext = imageFile?.type === 'image/png' || imageFile?.type === 'image/webp' ? 'webp' : 'jpg';
      const base64Image = canvas.toDataURL(`image/${ext === 'webp' ? 'webp' : 'jpeg'}`, 0.9);

      const link = document.createElement('a');
      link.href = base64Image;
      link.download = `cropped_${imageFile?.name.split('.')[0] || 'image'}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Error cropping image', err);
      alert('Failed to crop image.');
    }
  };

  const currentAspect = ASPECT_RATIOS[aspectIndex].value;

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30">
      </div>
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
          title="Reset"
        >
          <RotateCcw size={18} />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full lg:h-full">
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            {/* Source Image */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Source Image
                </h3>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      {isDragging ? 'Drop it here!' : imageSrc ? 'Replace Image' : 'Upload Image'}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Drag & drop or click to browse files.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                  <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    Settings
                  </h3>
                  <button 
                    onClick={handleDownload}
                    disabled={!imageSrc || !completedCrop?.width}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: persona.theme.primary }}
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
                <div className="p-4 flex flex-col gap-5 flex-1">
                
                {/* Aspect Ratio Selector */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Crop size={14} /> Aspect Ratio
                    </label>
                  </div>
                  <SegmentedControl
                    value={aspectIndex}
                    onChange={setAspectIndex}
                    options={ASPECT_RATIOS.map((ratio, idx) => ({
                      value: idx,
                      label: ratio.label
                    }))}
                  />
                  <div className="mt-3 text-[11px] text-slate-500">
                    <p>Drag the edges of the box to resize the crop area freely.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 lg:h-full lg:min-h-0">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col min-h-[400px] shrink-0 overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 z-10">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Cropper Workspace
                </h3>
              </div>
              
              <div className="flex-1 relative flex flex-col min-h-0">
                {!imageSrc ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-medium">No image selected.</span>
                  </div>
                ) : (
                  <div className="flex-1 relative checkerboard-bg overflow-hidden min-h-0 flex items-center justify-center p-4 md:p-6 rounded-b-xl">
                    <ReactCrop
                      crop={crop}
                      onChange={(pixelCrop) => setCrop(pixelCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={currentAspect}
                    >
                      <img 
                        ref={imgRef}
                        src={imageSrc} 
                        alt="Upload" 
                        onLoad={onImageLoad}
                        className=""
                        style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', width: 'auto', height: 'auto', objectFit: 'contain' }}
                      />
                    </ReactCrop>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ReactCrop {
          max-width: 100%;
          max-height: 100%;
          min-height: 0;
          min-width: 0;
          flex-shrink: 1;
        }
        .ReactCrop__child-wrapper {
          max-width: 100%;
          max-height: 100%;
          min-height: 0;
          min-width: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .ReactCrop__child-wrapper img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          display: block;
        }
      `}</style>
    </div>
  );
}
