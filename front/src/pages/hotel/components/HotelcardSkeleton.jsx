export function HotelCardSkeleton() {
  return (
    <>
      {/* Mobile Skeleton */}
      <div className="md:hidden relative rounded-xl overflow-hidden shadow-lg mb-4 h-96 animate-pulse">
        <div className="absolute inset-0 bg-gray-200"></div>
        <div className="absolute inset-0 bg-linear-to-t from-gray-400/50 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="space-y-3">
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="flex justify-between items-end pt-2">
              <div className="h-10 w-24 bg-gray-300 rounded-lg"></div>
              <div className="h-12 w-24 bg-gray-300 rounded-lg"></div>
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-5 w-16 bg-gray-300 rounded-full"></div>
              <div className="h-5 w-12 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden md:flex bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden animate-pulse">
        <div className="w-72 h-56 bg-gray-200 shrink-0" />
        <div className="flex-1 p-4">
          <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
    </>
  );
}
