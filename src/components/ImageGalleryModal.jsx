import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

import { twMerge } from 'tailwind-merge';

export default function ImageGalleryModal({ images, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMoved, setIsMoved] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const currentImage = images[currentIndex];
  
  // Format src from image object
  const getSrc = (img) => typeof img === 'string' ? img : img.url;

  // Reset zoom on image change
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  const handleNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  
  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 0.5);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 }); // Automatically recenter when zooming out fully
      }
      return newScale;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e) => {
    setIsMoved(false);
    if (scale <= 1) return; // Only drag when zoomed in
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setIsMoved(true);
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const touchStartDist = useRef(0);
  const touchStartScale = useRef(1);
  const touchStartPos = useRef({x: 0, y: 0});
  const touchFocalPoint = useRef({x: 0, y: 0});

  const handleTouchStart = (e) => {
    setIsMoved(false);
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartDist.current = dist;
      touchStartScale.current = scale;
      touchStartPos.current = position;
      touchFocalPoint.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      
      const zoomFactor = dist / (touchStartDist.current || 1);
      const newScale = Math.min(Math.max(touchStartScale.current * zoomFactor, 0.5), 5);
      
      const ratio = newScale / touchStartScale.current;
      
      let focalX = touchFocalPoint.current.x - window.innerWidth / 2;
      let focalY = touchFocalPoint.current.y - window.innerHeight / 2;
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        focalX = touchFocalPoint.current.x - (rect.left + rect.width / 2);
        focalY = touchFocalPoint.current.y - (rect.top + rect.height / 2);
      }
      
      const baseNewX = touchStartPos.current.x * ratio + focalX * (1 - ratio);
      const baseNewY = touchStartPos.current.y * ratio + focalY * (1 - ratio);
      
      const currentFocalX = (t1.clientX + t2.clientX) / 2;
      const currentFocalY = (t1.clientY + t2.clientY) / 2;
      const panX = currentFocalX - touchFocalPoint.current.x;
      const panY = currentFocalY - touchFocalPoint.current.y;
      
      setScale(newScale);
      setPosition({ x: baseNewX + panX, y: baseNewY + panY });
    } else if (e.touches.length === 1 && isDragging) {
      setIsMoved(true);
      setPosition({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (scale <= 1) setPosition({ x: 0, y: 0 }); // auto snap back if zoomed out
  };

  const handleDownload = async () => {
    try {
      const src = getSrc(currentImage);
      const a = document.createElement('a');
      a.href = src;
      a.download = `image_${Date.now()}.png`; // Simple fallback name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  if (!currentImage) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-white/95 dark:bg-black/95 flex flex-col backdrop-blur-sm select-none animate-in fade-in duration-200 touch-none">
      
      {/* Top Toolbar */}
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-gradient-to-b from-white/90 dark:from-black/80 to-transparent z-50">
        <div className="flex items-center gap-2 text-slate-500 dark:text-white/70 text-sm font-semibold tracking-wider">
          {images.length > 1 && <span>{currentIndex + 1} / {images.length}</span>}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-3">
          <button onClick={handleZoomOut} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10 rounded-full transition-colors" title="Zoom Out">
            <ZoomOut size={20} />
          </button>
          <button onClick={handleResetZoom} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10 rounded-full transition-colors" title="Reset Zoom">
            <RotateCcw size={18} />
          </button>
          <button onClick={handleZoomIn} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10 rounded-full transition-colors" title="Zoom In">
            <ZoomIn size={20} />
          </button>
          <div className="w-px h-6 bg-slate-300 dark:bg-white/20 mx-1 sm:mx-2" />
          <button onClick={handleDownload} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10 rounded-full transition-colors" title="Download">
            <Download size={20} />
          </button>
          <button onClick={onClose} className="p-2 text-slate-600 dark:text-white hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/80 dark:hover:text-white rounded-full transition-colors ml-2" title="Close">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div 
        ref={containerRef}
        className={twMerge(
          "flex-1 relative overflow-hidden flex items-center justify-center",
          scale > 1 ? "cursor-grab" : "cursor-default",
          isDragging && "cursor-grabbing"
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // Close if clicking background and hasn't dragged
          if (e.target === e.currentTarget && !isMoved) onClose();
        }}
      >
        <img
          ref={imageRef}
          src={getSrc(currentImage)}
          alt="Gallery View"
          className="max-w-full max-h-[85vh] object-contain transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
          draggable={false}
        />

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 bg-white/40 hover:bg-white/70 text-slate-800 border-slate-200/50 dark:bg-black/40 dark:hover:bg-black/70 dark:text-white dark:border-white/10 rounded-full backdrop-blur-md transition-colors border z-50"
          >
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>
        )}
        
        {currentIndex < images.length - 1 && (
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 bg-white/40 hover:bg-white/70 text-slate-800 border-slate-200/50 dark:bg-black/40 dark:hover:bg-black/70 dark:text-white dark:border-white/10 rounded-full backdrop-blur-md transition-colors border z-50"
          >
            <ChevronRight size={32} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="h-[88px] shrink-0 bg-white/90 dark:bg-black/80 border-t border-slate-200 dark:border-white/10 flex items-center px-4 overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div className="flex items-center gap-2 mx-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={twMerge(
                  "relative w-16 h-16 shrink-0 rounded-lg overflow-hidden transition-all",
                  idx === currentIndex 
                    ? "border-2 border-[var(--color-brand-magenta)] opacity-100 scale-105 z-10" 
                    : "opacity-40 hover:opacity-100 border-2 border-transparent"
                )}
              >
                <img 
                  src={getSrc(img)} 
                  alt={`Thumbnail ${idx}`} 
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>,
    document.body
  );
}
