/**
 * Skeleton loader card for espaces grid.
 * Matches the dimensions of EspaceCard.
 */
export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      {/* Image placeholder */}
      <div className="h-48 bg-slate-200" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-200 rounded w-2/3" />
          <div className="h-5 w-5 bg-slate-200 rounded" />
        </div>
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1">
            <div className="w-7 h-7 rounded-full bg-slate-200" />
            <div className="w-7 h-7 rounded-full bg-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-10 bg-slate-200 rounded" />
            <div className="h-6 w-11 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
