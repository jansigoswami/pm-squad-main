/**
 * Temporary placeholder for views that arrive in later prompts (Today,
 * My Tasks, Team Board, Calendar, Reminders, Dashboard, Workload, Analytics).
 * Each real view will replace this as its prompt is implemented.
 */
export default function PlaceholderPage({ title }) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        This view is coming up in a later prompt. The layout, auth, realtime
        sync and state stores are already wired up.
      </p>
    </div>
  );
}
