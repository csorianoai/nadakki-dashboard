"use client";

type MobileCameraInputProps = {
  id: string;
  accept: string;
  disabled?: boolean;
  onFile: (file: File | null) => void;
};

export function MobileCameraInput({ id, accept, disabled, onFile }: MobileCameraInputProps) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
    >
      <input
        id={id}
        type="file"
        accept={accept}
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      Tomar foto
    </label>
  );
}
