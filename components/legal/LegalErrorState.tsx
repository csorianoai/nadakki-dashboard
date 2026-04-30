"use client";

export function LegalErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100"
      role="alert"
    >
      <p className="font-medium">Error</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm text-white hover:bg-red-900"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
