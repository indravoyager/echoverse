import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

export default function ImageCropperModal({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = () => {
    if (croppedAreaPixels) {
      onComplete(croppedAreaPixels);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0f0f0f] rounded-2xl w-full max-w-md overflow-hidden flex flex-col  animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-white/10">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5 z-10">
          <h3 className="font-bold text-slate-800 dark:text-white">Adjust Photo</h3>
          <button onClick={onCancel} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-[300px] md:h-[400px] checkerboard-bg">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Zoom Controls & Actions */}
        <div className="p-4 flex flex-col gap-4 bg-white dark:bg-[#0f0f0f] z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
              style={{ '--slider-thumb-color': 'var(--color-brand-magenta)' }}
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleApply}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-brand-magenta)] to-[var(--color-brand-purple)] text-white font-bold  hover: transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Check size={18} />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
