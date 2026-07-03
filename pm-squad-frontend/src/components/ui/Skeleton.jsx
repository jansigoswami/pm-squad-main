/**
 * Animated skeleton placeholder rows for loading task lists.
 */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-2 w-1/3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
      <div className="h-5 w-12 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
    </div>
  );
}

export default function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
