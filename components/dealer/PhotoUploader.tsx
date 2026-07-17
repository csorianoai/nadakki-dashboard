"use client";

import { useCallback, useRef, useState } from "react";
import { GripVertical, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 10;
const ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.heic,.heif";

async function compressImage(file: File, maxWidth = 1600): Promise<File> {
  if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".heic")) {
    return file;
  }

  if (file.type.includes("heic") || file.name.toLowerCase().endsWith(".heic")) {
    return new File([file], file.name.replace(/\.heic$/i, ".jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export function PhotoUploader({
  maxPhotos = 5,
  onPhotosSelected,
  className,
}: {
  maxPhotos?: number;
  onPhotosSelected: (files: File[]) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const sync = useCallback(
    (next: { file: File; url: string }[]) => {
      setPhotos(next);
      onPhotosSelected(next.map((p) => p.file));
    },
    [onPhotosSelected],
  );

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, maxPhotos - photos.length);
    const processed: { file: File; url: string }[] = [];
    for (const f of list) {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) continue;
      const compressed = await compressImage(f);
      processed.push({ file: compressed, url: URL.createObjectURL(compressed) });
    }
    sync([...photos, ...processed].slice(0, maxPhotos));
  };

  const remove = (index: number) => {
    const copy = [...photos];
    URL.revokeObjectURL(copy[index]!.url);
    copy.splice(index, 1);
    sync(copy);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const copy = [...photos];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item!);
    sync(copy);
  };

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-r-sm border-2 border-dashed px-6 py-12 transition",
          dragOver ? "border-brand-2 bg-brand-2/5" : "border-nk-border bg-nk-surface-2 hover:border-brand-2/50",
        )}
      >
        <Upload className="mb-3 h-10 w-10 text-brand-2" />
        <p className="text-sm font-semibold text-nk-fg">Arrastra fotos aquí o click para seleccionar</p>
        <p className="mt-1 text-xs text-nk-fg-subtle">JPG, PNG, HEIC · Máx {MAX_SIZE_MB}MB por foto</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && void addFiles(e.target.files)}
        />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {Array.from({ length: maxPhotos }).map((_, i) => {
          const photo = photos[i];
          return (
            <div
              key={i}
              draggable={!!photo}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) reorder(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn(
                "relative aspect-square overflow-hidden rounded-r-sm border border-nk-border bg-nk-surface-3",
                !photo && "border-dashed",
              )}
            >
              {photo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                    aria-label="Remover foto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <GripVertical className="absolute bottom-1 left-1 h-3 w-3 text-white drop-shadow" />
                </>
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-nk-fg-subtle">
                  {i + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
