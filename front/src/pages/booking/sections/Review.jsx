import React, { useMemo, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Stars } from "../components";
import { parseNumber } from "../utils/bookingHelpers";

export const ReviewSection = ({
  reviewsArray = [],
  reviewCount = 0,
  hotelRating = null,
}) => {
  const [showAll, setShowAll] = useState(false);

  const safeRating = useMemo(() => {
    // Only use hotel-level rating when there are actually reviews recorded in DB
    const hasServerReviews = (Number(reviewCount) || 0) > 0;
    if (hasServerReviews && hotelRating !== null && hotelRating !== undefined && hotelRating !== "") {
      return Math.max(0, Math.min(5, hotelRating));
    }

    const fromReviews = (Array.isArray(reviewsArray) ? reviewsArray : [])
      .map((r) => parseNumber(r?.rating ?? r?.stars ?? 0, 0))
      .filter((x) => x > 0 && x <= 5);
    if (!fromReviews.length) return null;
    return (
      Math.round(
        (fromReviews.reduce((a, b) => a + b, 0) / fromReviews.length) * 10
      ) / 10
    );
  }, [hotelRating, reviewsArray, reviewCount]);

  const ratingDistribution = useMemo(() => {
    const list = Array.isArray(reviewsArray) ? reviewsArray : [];
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    list.forEach((r) => {
      const score = Math.round(parseNumber(r?.rating ?? r?.stars ?? 0, 0));
      if (score >= 1 && score <= 5) counts[score]++;
    });
    return counts;
  }, [reviewsArray]);

  const displayedReviews = useMemo(() => {
    if (!Array.isArray(reviewsArray)) return [];
    return showAll ? reviewsArray : reviewsArray.slice(0, 3);
  }, [reviewsArray, showAll]);

  const totalReviewsDisplay =
    reviewCount || (Array.isArray(reviewsArray) ? reviewsArray.length : 0);

  return (
    <div className="bg-white p-5 sm:p-6 font-['Roboto',sans-serif]">
      
        <div className="flex items-center gap-2 text-neutral-900">
          <MessageSquare size={18} className="text-neutral-500" />
          <h2 className="text-base sm:text-lg font-bold">
            Guest Ratings & Reviews
          </h2>
        </div>
        {totalReviewsDisplay > 0 && (
          <span className="text-xs font-medium text-neutral-500">
            {totalReviewsDisplay} Verified Review
            {totalReviewsDisplay > 1 ? "s" : ""}
          </span>
        )}
   

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pb-5 border-b border-neutral-100">
        <div className="sm:col-span-5 flex items-center gap-4 sm:border-r sm:border-neutral-200 sm:pr-4">
          <div className="text-4xl font-black text-neutral-900 tracking-tight">
            {safeRating ? Number(safeRating).toFixed(1) : "N/A"}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {safeRating ? (
                <Stars value={safeRating} />
              ) : (
                <div className="flex text-neutral-300">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} />
                  ))}
                </div>
              )}
            </div>
            <div className="text-xs text-neutral-500 font-medium">
              {totalReviewsDisplay > 0
                ? `Based on ${totalReviewsDisplay} review${
                    totalReviewsDisplay > 1 ? "s" : ""
                  }`
                : "No verified ratings yet"}
            </div>
          </div>
        </div>

        <div className="sm:col-span-7 space-y-1.5">
          {[5, 4, 3, 2, 1].map((score) => {
            const count = ratingDistribution[score] || 0;
            const total = reviewsArray.length || 1;
            const percentage = reviewsArray.length
              ? Math.round((count / total) * 100)
              : 0;
            return (
              <div key={score} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-neutral-600 font-medium text-right">
                  {score}
                </span>
                <Star
                  size={10}
                  className="text-neutral-400 fill-neutral-400"
                />
                <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-7 text-neutral-400 text-right font-medium">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {Array.isArray(reviewsArray) && reviewsArray.length > 0 ? (
        <div className="space-y-3 pt-5">
          {displayedReviews.map((r, i) => {
            const name = r?.name || r?.userName || "Verified Guest";
            const rating = parseNumber(r?.rating ?? r?.stars ?? 0, 0);
            const text = r?.comment || r?.review || r?.message || "";
            const date = r?.date || r?.createdAt || null;
            const formattedDate = date
              ? new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : null;

            return (
              <div
                key={r?._id || r?.id || i}
                className="rounded-lg border border-neutral-100 bg-neutral-50/60 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-white border border-neutral-200 flex items-center justify-center font-bold text-neutral-700 text-xs shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 truncate">
                        {name}
                      </div>
                      {formattedDate && (
                        <div className="text-[10px] text-neutral-400">
                          {formattedDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {rating > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-neutral-200 bg-white text-neutral-900 text-xs font-bold shrink-0">
                      <Star size={11} className="fill-neutral-900" />
                      <span>{rating}</span>
                    </div>
                  )}
                </div>

                {text && (
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {text}
                  </p>
                )}
              </div>
            );
          })}

          {reviewsArray.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="w-full py-2.5 text-xs font-bold text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition"
            >
              {showAll
                ? "Show Less"
                : `View All ${reviewsArray.length} Reviews`}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center pt-5">
          <p className="text-xs text-neutral-400 font-medium">
            No guest reviews submitted for this property yet.
          </p>
        </div>
      )}
    </div>
  );
};