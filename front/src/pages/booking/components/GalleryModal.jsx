import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PLACEHOLDER_IMAGE } from "../utils/bookingHelpers";

const GalleryModal = ({ images, startIndex = 0, title, onClose }) => {
  const safeImages =
    Array.isArray(images) && images.length ? images : [PLACEHOLDER_IMAGE];
  const [idx, setIdx] = useState(
    Math.min(Math.max(startIndex, 0), safeImages.length - 1)
  );
  const thumbnailRefs = useRef([]);

  const prev = () =>
    setIdx((p) => (p - 1 + safeImages.length) % safeImages.length);
  const next = () =>
    setIdx((p) => (p + 1) % safeImages.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, safeImages.length]);

  useEffect(() => {
    if (thumbnailRefs.current[idx]) {
      thumbnailRefs.current[idx].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [idx]);

  return (
    <div className="fixed inset-0 z-[130] bg-neutral-950/90 backdrop-blur-md font-['Roboto',sans-serif] flex flex-col justify-between select-none">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800/80">
        <div className="min-w-0 flex items-baseline gap-3">
          <h2 className="text-sm sm:text-base font-bold text-neutral-100 truncate">
            {title || "Photo Gallery"}
          </h2>
          <span className="text-xs text-neutral-400 font-medium">
            {idx + 1} of {safeImages.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4 sm:px-12 py-4">
        <div className="relative w-full max-w-5xl h-full max-h-[70vh] flex items-center justify-center">
          <img
            src={safeImages[idx]}
            alt={`View ${idx + 1}`}
            className="w-full h-full object-contain rounded-lg shadow-2xl"
          />

          {safeImages.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-neutral-200 hover:text-white border border-neutral-700 transition shadow-lg"
                aria-label="Previous image"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={next}
                className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-neutral-200 hover:text-white border border-neutral-700 transition shadow-lg"
                aria-label="Next image"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 py-4 border-t border-neutral-800/80">
        <div className="flex gap-2.5 overflow-x-auto justify-start sm:justify-center no-scrollbar py-1">
          {safeImages.map((src, i) => {
            const selected = i === idx;
            return (
              <button
                key={`${src}-${i}`}
                ref={(el) => (thumbnailRefs.current[i] = el)}
                onClick={() => setIdx(i)}
                className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden transition-all duration-200 border-2 ${
                  selected
                    ? "border-white scale-105 opacity-100 ring-2 ring-neutral-700"
                    : "border-transparent opacity-40 hover:opacity-80"
                }`}
              >
                <img
                  src={src}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GalleryModal;