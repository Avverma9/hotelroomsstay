import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../utils/bookingHelpers';

/**
 * Full-screen Gallery Modal with thumbnails
 */
const GalleryModal = ({ images, startIndex = 0, title, onClose }) => {
  const safeImages = Array.isArray(images) && images.length ? images : [PLACEHOLDER_IMAGE];
  const [idx, setIdx] = useState(Math.min(Math.max(startIndex, 0), safeImages.length - 1));

  const prev = () => setIdx((p) => (p - 1 + safeImages.length) % safeImages.length);
  const next = () => setIdx((p) => (p + 1) % safeImages.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, safeImages.length]);

  return (
    <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm">
      <div className="h-full w-full flex flex-col">
        <div className="px-4 py-3 flex items-center justify-between text-white">
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{title || 'Photos'}</div>
            <div className="text-xs opacity-80">
              {idx + 1}/{safeImages.length}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-6">
          <div className="relative w-full max-w-4xl">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
              <img src={safeImages[idx]} alt="photo" className="w-full max-h-[75vh] object-contain" />
            </div>
            {safeImages.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {safeImages.slice(0, 24).map((src, i) => {
              const selected = i === idx;
              return (
                <button
                  key={`${src}-${i}`}
                  onClick={() => setIdx(i)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border ${
                    selected ? 'border-white' : 'border-white/20'
                  }`}
                >
                  <img src={src} alt="thumb" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryModal;
