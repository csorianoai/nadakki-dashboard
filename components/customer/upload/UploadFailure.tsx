"use client";

import { messages } from "@/lib/customer/upload/messages";

type UploadFailureProps = {
  message?: string;
  onRetry: () => void;
};

export function UploadFailure({ message, onRetry }: UploadFailureProps) {
  return (
    <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center" role="alert">
      <h2 className="font-semibold text-red-900">{messages.failureTitle}</h2>
      {message ? <p className="text-sm text-red-800">{message}</p> : null}
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[44px] w-full rounded-lg bg-red-700 px-4 py-3 text-sm font-medium text-white"
      >
        {messages.retry}
      </button>
    </div>
  );
}
