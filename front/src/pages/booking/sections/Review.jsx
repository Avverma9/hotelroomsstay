import React, { useMemo } from "react";
import { Star } from "lucide-react";
import { SectionCard, Stars } from "../components";
import { parseNumber } from "../utils/bookingHelpers";

export const ReviewSection = ({
  reviewsArray = [],
  reviewCount = 0,
  hotelRating = null,
}) => {
  const safeRating = useMemo(() => {
    if (hotelRating !== null && hotelRating !== undefined && hotelRating !== "")
      return Math.max(0, Math.min(5, hotelRating));
    const fromReviews = (Array.isArray(reviewsArray) ? reviewsArray : [])
      .map((r) => parseNumber(r?.rating ?? r?.stars ?? 0, 0))
      .filter((x) => x > 0 && x <= 5);
    if (!fromReviews.length) return null;
    return (
      Math.round((fromReviews.reduce((a, b) => a + b, 0) / fromReviews.length) * 10) / 10
    );
  }, [hotelRating, reviewsArray]);

  return (
    <SectionCard title="Reviews" icon={<Star size={20} className="text-yellow-500" />}>
      {/* Overall Rating Box */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-gray-900">Overall</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-extrabold text-gray-900">
                {safeRating || "N/A"}
              </span>
              {safeRating && <Stars value={safeRating} />}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {reviewCount ? `${reviewCount} review${reviewCount > 1 ? "s" : ""}` : "No reviews found"}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {Array.isArray(reviewsArray) && reviewsArray.length > 0 && (
        <div className="mt-4 space-y-3">
          {reviewsArray.slice(0, 2).map((r, i) => {
            const name = r?.name || r?.userName || "Guest";
            const rating = parseNumber(r?.rating ?? r?.stars ?? 0, 0);
            const text = r?.comment || r?.review || r?.message || "";
            return (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-bold text-gray-900 text-sm truncate">{name}</div>
                  {rating > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
                      <Star size={12} fill="currentColor" />
                      {rating}
                    </span>
                  )}
                </div>
                {text && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{text}</p>
                )}
              </div>
            );
          })}

          {/* View More Button (Shows only if more than 2 reviews exist) */}
          {reviewsArray.length > 2 && (
            <button
              onClick={() => {
                /* Handle View All Logic Here */
              }}
              className="w-full py-3 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-200"
            >
              View all {reviewsArray.length} reviews
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
};
