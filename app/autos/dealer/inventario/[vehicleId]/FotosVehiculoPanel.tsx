"use client";

/**
 * Fotos de UN vehiculo: listar, subir y eliminar (D5, contrato P4 parte 2).
 *
 * Nunca se muestra el nombre original del archivo: el texto alternativo es la
 * posicion de la foto. El tope de fotos no se cablea: si se alcanza, el error
 * del backend (`max_photos_reached:<n>`) lo dice.
 */

import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PHOTO_ACCEPT, PHOTO_ERROR_HINT, deleteVehiclePhoto, fetchVehiclePhotos, photoError, uploadVehiclePhoto, type PhotoError,
} from "./fotos";

const BOX_CLASS = "mt-3 rounded-r-sm border border-nk-border bg-nk-surface p-3 text-sm text-nk-fg";

function Aviso({ error, testId }: { error: PhotoError; testId: string }) {
  return (
    <div role="alert" data-testid={testId} data-reason-code={error.reasonCode} data-kind={error.kind} className={BOX_CLASS}>
      <p>{error.message}</p>
      <p className="mt-1 text-nk-fg-muted">{PHOTO_ERROR_HINT[error.kind]}</p>
    </div>
  );
}

export function FotosVehiculoPanel({ vehicleId }: { vehicleId: string }) {
  const client = useQueryClient();
  const [error, setError] = useState<PhotoError | null>(null);
  const [ack, setAck] = useState<string | null>(null);
  const queryKey = ["vehicle-photos", vehicleId];

  const photos = useQuery({ queryKey, queryFn: () => fetchVehiclePhotos(vehicleId), retry: false });

  const handlers = (mensaje: string) => ({
    onSuccess: () => {
      setError(null);
      setAck(mensaje);
      void client.invalidateQueries({ queryKey });
    },
    onError: (err: unknown) => {
      setAck(null);
      setError(photoError(err));
    },
  });

  const upload = useMutation({
    mutationFn: (file: File) => uploadVehiclePhoto(vehicleId, file),
    ...handlers("Foto subida."),
  });
  const remove = useMutation({
    mutationFn: (mediaId: string) => deleteVehiclePhoto(vehicleId, mediaId),
    ...handlers("Foto eliminada."),
  });
  const busy = upload.isPending || remove.isPending;

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) upload.mutate(file);
  };

  return (
    <section data-testid="vehicle-photos" className="rounded-xl border border-nk-border bg-nk-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Fotos</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-nk-border px-4 text-sm font-semibold text-nk-fg">
          {upload.isPending ? "Subiendo…" : "Subir foto"}
          <input
            type="file"
            accept={PHOTO_ACCEPT}
            className="sr-only"
            data-testid="vehicle-photos-input"
            disabled={busy}
            onChange={onFile}
          />
        </label>
      </div>
      <p className="mt-1 text-xs text-nk-fg-muted">JPG, PNG o WebP, hasta 10 MB. Se publican sin el nombre del archivo.</p>

      {error ? <Aviso error={error} testId="vehicle-photos-error" /> : null}
      {ack ? (
        <p role="status" data-testid="vehicle-photos-ack" className="mt-3 text-sm text-nk-fg">
          {ack}
        </p>
      ) : null}

      {photos.isPending ? (
        <p className="mt-3 animate-pulse text-sm text-nk-fg-muted" data-testid="vehicle-photos-loading">
          Cargando fotos…
        </p>
      ) : photos.error ? (
        <Aviso error={photoError(photos.error)} testId="vehicle-photos-load-error" />
      ) : photos.data.length === 0 ? (
        <p className="mt-3 text-sm text-nk-fg-muted" data-testid="vehicle-photos-empty">
          Este vehículo todavía no tiene fotos.
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.data.map((photo, index) => (
            <li key={photo.id} data-testid="vehicle-photo" data-media-id={photo.id} className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- CDN publico de fotos */}
              <img
                src={photo.url}
                alt={`Foto ${index + 1} del vehículo`}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-r-sm border border-nk-border object-cover"
              />
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-nk-fg-muted">{photo.isPrimary ? "Principal" : `Foto ${index + 1}`}</span>
                <button
                  type="button"
                  className="font-semibold text-nk-fg underline disabled:opacity-60"
                  disabled={busy}
                  onClick={() => remove.mutate(photo.id)}
                  aria-label={`Eliminar foto ${index + 1}`}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
