"use client";

import { messages } from "@/lib/customer/upload/messages";

export function UploadSuccess() {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center" role="status">
      <h2 className="text-lg font-semibold text-emerald-900">{messages.successTitle}</h2>
      <p className="mt-2 text-emerald-900">{messages.successBody}</p>
    </div>
  );
}
