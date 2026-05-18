"use client";

type FilePickerInputProps = {
  id: string;
  accept: string;
  disabled?: boolean;
  onFiles: (files: FileList | null) => void;
};

export function FilePickerInput({ id, accept, disabled, onFiles }: FilePickerInputProps) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
    >
      <input
        id={id}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onFiles(e.target.files)}
      />
      Elegir archivos
    </label>
  );
}
